import React, { useEffect, useRef, useState } from 'react';
import {
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { safeParseJson } from '../lib/api.ts';
import { formatBDT } from '../lib/images.ts';
import type { Product } from '../types/store.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface AssistantWidgetProps {
  products: Product[];
  onInspectProduct: (product: Product) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  recommendedProductIds?: number[];
  isError?: boolean;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'model',
  text: 'Assalamu Alaikum! I am your 18 aana style & care concierge. Ask me for outfit recommendations, sizing help, gift ideas, or delivery details across Bangladesh.',
};

const QUICK_PROMPTS = [
  'Eid Punjabi or Sharee ideas',
  'Gift under ৳2,500',
  'Size & fit guide',
  'Dhaka delivery & returns',
];

export const AssistantWidget: React.FC<AssistantWidgetProps> = ({
  products,
  onInspectProduct,
}) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pending, open]);

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || pending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
    };

    const historyForServer = messages
      .filter((m) => m.id !== 'welcome' && !m.isError)
      .map((m) => ({
        role: m.role,
        text: m.text,
      }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setPending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyForServer,
        }),
      });

      const data = await safeParseJson<{
        reply: string;
        recommendedProductIds?: number[];
      }>(res);

      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          role: 'model',
          text: data.reply,
          recommendedProductIds: Array.isArray(data.recommendedProductIds)
            ? data.recommendedProductIds
            : [],
        },
      ]);
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text:
            err instanceof Error
              ? err.message
              : 'Sorry, I could not reply right now. Please try again.',
          isError: true,
        },
      ]);
    } finally {
      setPending(false);
    }
  };

  const resetChat = () => {
    if (pending) return;
    setMessages([INITIAL_MESSAGE]);
  };

  return (
    <div className="fixed right-4 bottom-4 z-40">
      {open && (
        <div
          className="w-[min(380px,calc(100vw-32px))] bg-white border border-[#e8d5d8] rounded-sm shadow-2xl mb-2.5 overflow-hidden flex flex-col"
          role="dialog"
          aria-label="18 aana Style Concierge"
        >
          {/* Chat Header */}
          <div className="bg-[#7a001e] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-[#d4af37] shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold leading-tight truncate">
                  18 aana Concierge
                </div>
                <div className="text-[11px] text-white/75 leading-tight">
                  Style advice, sizing &amp; store help
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={resetChat}
                disabled={pending || messages.length <= 1}
                title="Start new conversation"
                aria-label="Start new conversation"
                className="p-1.5 text-white/80 hover:text-white disabled:opacity-40"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close style concierge"
                className="p-1 text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Message Thread */}
          <div
            ref={scrollRef}
            className="h-80 overflow-y-auto p-3.5 flex flex-col gap-3 bg-white"
          >
            {messages.map((m) => {
              const recommendedProducts = (m.recommendedProductIds ?? [])
                .map((id) => products.find((p) => p.id === id))
                .filter((p): p is Product => Boolean(p));

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] px-3.5 py-2.5 rounded-sm text-sm leading-relaxed whitespace-pre-line ${
                      m.role === 'user'
                        ? 'bg-[#7a001e] text-white'
                        : m.isError
                          ? 'bg-[#fcf5f6] border border-[#b3002d] text-[#7a001e]'
                          : 'bg-[#fcf5f6] text-[#1a0508]'
                    }`}
                  >
                    {m.text}
                  </div>

                  {recommendedProducts.length > 0 && (
                    <div className="mt-2 w-[88%] space-y-1.5">
                      {recommendedProducts.map((prod) => {
                        const price =
                          prod.discountPrice && prod.discountPrice > 0
                            ? prod.discountPrice
                            : prod.basePrice;
                        return (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => onInspectProduct(prod)}
                            className="w-full flex items-center gap-2.5 p-2 bg-white border border-[#e8d5d8] rounded-sm hover:border-[#7a001e] text-left transition-colors group"
                          >
                            <div className="w-10 h-12 rounded-sm overflow-hidden bg-[#fcf5f6] shrink-0">
                              <ResilientImage
                                src={prod.imageUrls?.[0]}
                                alt={prod.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-[#1a0508] group-hover:text-[#7a001e] truncate">
                                {prod.title}
                              </div>
                              <div className="text-[11px] text-[#7a5c61] tabular-nums">
                                {formatBDT(price)}
                                {prod.sizes && prod.sizes.length > 0
                                  ? ` · ${prod.sizes.join(', ')}`
                                  : ''}
                              </div>
                            </div>
                            <span className="text-[11px] font-semibold text-[#7a001e] shrink-0 pr-1">
                              View
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {pending && (
              <div className="self-start px-3.5 py-2 rounded-sm bg-[#fcf5f6] text-xs text-[#7a5c61]">
                Curating reply...
              </div>
            )}
          </div>

          {/* Starter Prompts */}
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-1.5 px-3.5 pb-2.5 bg-white">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={pending}
                  onClick={() => sendMessage(prompt)}
                  className="text-[11px] px-2.5 py-1 border border-[#e8d5d8] rounded-sm text-[#1a0508] hover:border-[#7a001e] hover:text-[#7a001e] disabled:opacity-50 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex gap-2 p-2.5 border-t border-[#e8d5d8] bg-[#fcf5f6]"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={pending}
              placeholder="Ask about outfits, sizes, prices..."
              aria-label="Ask the 18 aana concierge"
              className="flex-1 min-w-0 bg-white border border-[#e8d5d8] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#7a001e] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              aria-label="Send message"
              className="px-3.5 bg-[#7a001e] text-white rounded-sm hover:bg-[#4a0012] disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 bg-[#7a001e] text-white px-5 py-3 rounded-sm font-medium text-sm shadow-lg hover:bg-[#4a0012] transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        <span>Style Concierge</span>
      </button>
    </div>
  );
};
