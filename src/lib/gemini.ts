import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { listProducts, type ProductWithCategory } from '../db/catalog.ts';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'Gemini API key is not configured. Please add GEMINI_API_KEY in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 25000,
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractReadableMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string } };
    if (parsed?.error?.message) return parsed.error.message;
  } catch {
    // not JSON
  }
  return raw;
}

function mapGeminiError(error: unknown): Error {
  console.error('[18aana-gemini] API error:', error);
  const raw = extractReadableMessage(error);
  const lower = raw.toLowerCase();

  if (
    lower.includes('permission_denied') ||
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('403')
  ) {
    return new Error(
      'Gemini API key could not be authorized. Please verify GEMINI_API_KEY in Settings > Secrets.'
    );
  }
  if (lower.includes('resource_exhausted') || lower.includes('429')) {
    return new Error(
      'Assistant quota is temporarily busy. Please wait a moment and try again.'
    );
  }
  if (lower.includes('not_found') || lower.includes('404')) {
    return new Error(
      'Configured Gemini model is unavailable. Please verify the model configuration.'
    );
  }
  if (lower.includes('deadline') || lower.includes('504') || lower.includes('timeout')) {
    return new Error(
      'The style concierge took a little too long to respond. Please try sending your question again.'
    );
  }
  return new Error(
    raw || 'Unable to reach the 18 aana shopping assistant right now.'
  );
}

function isTransientError(error: unknown): boolean {
  const msg = (
    error instanceof Error ? error.message : String(error)
  ).toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('500') ||
    msg.includes('deadline') ||
    msg.includes('timeout') ||
    msg.includes('network') ||
    msg.includes('unavailable')
  );
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (firstError: unknown) {
    if (!isTransientError(firstError)) {
      throw mapGeminiError(firstError);
    }
    await new Promise((r) => setTimeout(r, 350));
    try {
      return await fn();
    } catch (secondError: unknown) {
      throw mapGeminiError(secondError);
    }
  }
}

export interface ChatTurnInput {
  role: 'user' | 'model';
  text: string;
}

export interface ConciergeChatResponse {
  reply: string;
  recommendedProductIds: number[];
}

function buildCatalogContext(catalog: ProductWithCategory[]): string {
  const compact = catalog.map((p) => {
    const effectivePrice =
      p.discountPrice !== null && p.discountPrice > 0
        ? p.discountPrice
        : p.basePrice;
    return {
      id: p.id,
      title: p.title,
      department: p.department,
      category: p.categoryName,
      priceBDT: effectivePrice,
      originalPriceBDT: p.basePrice,
      sizes: Array.isArray(p.sizes) ? p.sizes : [],
      stock: p.stockQuantity,
      tag: p.tag,
    };
  });
  return JSON.stringify(compact);
}

export async function runStoreConciergeChat(params: {
  message: string;
  history: ChatTurnInput[];
}): Promise<ConciergeChatResponse> {
  const ai = getGeminiClient();
  const catalog = await listProducts();
  const validProductIds = new Set(catalog.map((p) => p.id));

  const systemInstruction = `You are the "18 aana Style & Care Concierge" for 18 aana, a Bangladeshi clothing and lifestyle brand in Banani, Dhaka.
Your tone is warm, refined, concise, and genuinely helpful.
Store policies:
- Delivery: Inside Dhaka ৳80 (1–2 days), FREE inside Dhaka when subtotal > ৳2,500. Outside Dhaka ৳150 flat (3–5 days).
- Payments: Cash on Delivery (COD), bKash, and Nagad.
- Returns: 7-day easy return or free size exchange on unworn items with tags.
- Sizing: Apparel (Punjabi, Kurti, Shirt) uses Bangladeshi tailoring (S: 38", M: 40", L: 42", XL: 44", XXL: 46" chest; Kids Fatua uses 2-3Y to 8-9Y). Items with empty sizes ([]) like Jamdani Sharees (12 haat with blouse piece), Wool Shawls, Bags, Jewellery, and Home Decor need no size selection.
- Order Tracking: /track page using the 18A-... order ID.

Live Product Catalog (JSON):
${buildCatalogContext(catalog)}

Guidelines:
- Only recommend products in the Live Product Catalog above with exact BDT (৳) prices and sizes.
- Include up to 3 matching product IDs in "recommendedProductIds" when recommending items, or [] for general policy questions.`;

  const sanitizedHistory = params.history
    .filter(
      (turn) =>
        (turn.role === 'user' || turn.role === 'model') &&
        typeof turn.text === 'string' &&
        turn.text.trim().length > 0
    )
    .slice(-14)
    .map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text.trim() }],
    }));

  const sendWithModel = async (
    model: 'gemini-3.8-flash' | 'gemini-3.1-flash-lite'
  ) => {
    const chat = ai.chats.create({
      model,
      history: sanitizedHistory,
      config: {
        systemInstruction,
        ...(model === 'gemini-3.8-flash'
          ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
          : {}),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description:
                'Helpful, concise response for the customer (2 to 4 sentences or short bullet points).',
            },
            recommendedProductIds: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
              description:
                'Up to 3 valid product IDs from the Live Product Catalog to highlight below the reply.',
            },
          },
          required: ['reply', 'recommendedProductIds'],
        },
      },
    });

    const response = await chat.sendMessage({
      message: params.message.trim(),
    });

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      throw new Error('The assistant returned an empty response. Please try again.');
    }

    try {
      const parsed = JSON.parse(rawText) as {
        reply?: string;
        recommendedProductIds?: unknown;
      };
      const reply =
        typeof parsed.reply === 'string' && parsed.reply.trim()
          ? parsed.reply.trim()
          : rawText;
      const recommendedProductIds = Array.isArray(parsed.recommendedProductIds)
        ? Array.from(
            new Set(
              parsed.recommendedProductIds
                .map((id) => Number(id))
                .filter((id) => Number.isInteger(id) && validProductIds.has(id))
            )
          ).slice(0, 3)
        : [];
      return { reply, recommendedProductIds };
    } catch {
      return { reply: rawText, recommendedProductIds: [] };
    }
  };

  try {
    return await sendWithModel('gemini-3.8-flash');
  } catch (err: unknown) {
    if (!isTransientError(err)) {
      throw mapGeminiError(err);
    }
    try {
      return await sendWithModel('gemini-3.1-flash-lite');
    } catch (fallbackErr: unknown) {
      throw mapGeminiError(fallbackErr);
    }
  }
}

export async function generateAdminProductDescription(input: {
  title: string;
  department: string;
  categoryName: string;
  sizes: string[];
  tag?: string | null;
}): Promise<string> {
  const ai = getGeminiClient();

  const prompt = `Write a refined, authentic 2-to-3 sentence e-commerce product description for "18 aana" (a Bangladeshi clothing & lifestyle boutique).
Product Title: ${input.title}
Department: ${input.department}
Category: ${input.categoryName}
Available Sizes: ${input.sizes.length > 0 ? input.sizes.join(', ') : 'One-size / No size selection'}
Tag: ${input.tag || 'None'}

Focus on craftsmanship, breathable comfort suited for Bangladesh's climate, tailoring/weave feel, and styling occasion. Keep it under 55 words, plain prose only (no markdown bullets or hashtags).`;

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction:
          'You are an editorial copywriter for 18 aana, a Bangladeshi heritage and contemporary clothing house.',
      },
    });

    const text = (response.text ?? '').trim();
    if (!text) {
      throw new Error('Could not generate description. Please try again.');
    }
    return text;
  });
}
