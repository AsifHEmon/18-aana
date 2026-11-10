import bcrypt from 'bcryptjs';
import { count } from 'drizzle-orm';
import { db } from './index.ts';
import { adminUsers, categories, feedbacks, products } from './schema.ts';

const SEED_CATEGORIES = [
  { name: 'Punjabi', slug: 'punjabi', department: 'Men', imageUrl: 'punjabi', displayOrder: 1 },
  { name: 'Sharee', slug: 'sharee', department: 'Women', imageUrl: 'sharee', displayOrder: 2 },
  { name: 'Kurti', slug: 'kurti', department: 'Women', imageUrl: 'kurti', displayOrder: 3 },
  { name: 'Three-piece', slug: 'three-piece', department: 'Women', imageUrl: 'threepiece', displayOrder: 4 },
  { name: 'Fatua', slug: 'fatua', department: 'Kids', imageUrl: 'fatua', displayOrder: 5 },
  { name: 'Casual Shirt', slug: 'casual-shirt', department: 'Men', imageUrl: 'flannel', displayOrder: 6 },
  { name: 'Salwar', slug: 'salwar', department: 'Women', imageUrl: 'threepiece', displayOrder: 7 },
  { name: 'Shawl', slug: 'shawl', department: 'Winter', imageUrl: 'shawl', displayOrder: 8 },
  { name: 'Flannel', slug: 'flannel', department: 'Winter', imageUrl: 'flannel', displayOrder: 9 },
  { name: 'Bags', slug: 'bags', department: 'Accessories', imageUrl: 'bags', displayOrder: 10 },
  { name: 'Jewellery', slug: 'jewellery', department: 'Accessories', imageUrl: 'jewelry', displayOrder: 11 },
  { name: 'Home Decor', slug: 'home-decor', department: 'Accessories', imageUrl: 'homedecor', displayOrder: 12 },
];

const SEED_PRODUCTS = [
  {
    title: 'Cotton Punjabi',
    slug: 'cotton-punjabi',
    description:
      'Hand-finished combed cotton punjabi in warm ivory with intricate maroon placket embroidery. Tailored for festive gatherings and everyday comfort in humid weather.',
    basePrice: 1850,
    discountPrice: null,
    tag: 'New',
    stockQuantity: 28,
    imageUrls: ['punjabi'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    department: 'Men',
    categorySlug: 'punjabi',
    isFeatured: true,
  },
  {
    title: 'Jamdani Sharee',
    slug: 'jamdani-sharee',
    description:
      'Authentic handloom Dhakai Jamdani weave in deep maroon accented with antique gold zari motifs. Light, breathable drape crafted over weeks by Narayanganj weavers.',
    basePrice: 4200,
    discountPrice: null,
    tag: null,
    stockQuantity: 12,
    imageUrls: ['sharee'],
    sizes: [] as string[],
    department: 'Women',
    categorySlug: 'sharee',
    isFeatured: true,
  },
  {
    title: 'Block Print Kurti',
    slug: 'block-print-kurti',
    description:
      'Artisanal wooden block-printed cotton kurti in deep crimson and cream botanical motifs. Side slits and three-quarter sleeves tailored for effortless daily wear.',
    basePrice: 1700,
    discountPrice: 1450,
    tag: '-15%',
    stockQuantity: 34,
    imageUrls: ['kurti'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    department: 'Women',
    categorySlug: 'kurti',
    isFeatured: true,
  },
  {
    title: 'Wool Shawl',
    slug: 'wool-shawl',
    description:
      'Soft brushed winter wool shawl in burgundy maroon with a traditional woven gold border and hand-knotted tassels. Ideal for crisp Dhaka mornings and evening outings.',
    basePrice: 2300,
    discountPrice: null,
    tag: 'New',
    stockQuantity: 19,
    imageUrls: ['shawl'],
    sizes: [] as string[],
    department: 'Winter',
    categorySlug: 'shawl',
    isFeatured: true,
  },
  {
    title: 'Flannel Shirt',
    slug: 'flannel-shirt',
    description:
      'Heavyweight brushed cotton flannel overshirt in maroon, charcoal, and ivory check. Features twin chest pockets and horn-finish buttons for winter layering.',
    basePrice: 1650,
    discountPrice: null,
    tag: null,
    stockQuantity: 24,
    imageUrls: ['flannel'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    department: 'Winter',
    categorySlug: 'flannel',
    isFeatured: true,
  },
  {
    title: 'Printed Three-piece',
    slug: 'printed-three-piece',
    description:
      'Festive unstitched and semi-tailored three-piece salwar kameez with handloom silk-blend dupatta in deep maroon and muted gold tones.',
    basePrice: 3100,
    discountPrice: null,
    tag: null,
    stockQuantity: 16,
    imageUrls: ['threepiece'],
    sizes: [] as string[],
    department: 'Women',
    categorySlug: 'three-piece',
    isFeatured: true,
  },
  {
    title: 'Checked Cotton Shirt',
    slug: 'checked-cotton-shirt',
    description:
      'Breathable yarn-dyed Bengali cotton casual shirt cut in a relaxed straight silhouette with single chest pocket.',
    basePrice: 1250,
    discountPrice: null,
    tag: null,
    stockQuantity: 30,
    imageUrls: ['flannel'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    department: 'Men',
    categorySlug: 'casual-shirt',
    isFeatured: true,
  },
  {
    title: 'Fatua Set',
    slug: 'fatua-set',
    description:
      'Soft unbleached handloom cotton kids fatua with maroon geometric trim and wooden buttons. Gentle on young skin and pre-washed for zero shrinkage.',
    basePrice: 1100,
    discountPrice: null,
    tag: 'New',
    stockQuantity: 22,
    imageUrls: ['fatua'],
    sizes: ['2-3Y', '4-5Y', '6-7Y', '8-9Y'],
    department: 'Kids',
    categorySlug: 'fatua',
    isFeatured: true,
  },
  {
    title: 'Embroidered Canvas Tote',
    slug: 'embroidered-canvas-tote',
    description:
      'Structured heavy cotton canvas and maroon full-grain leather tote bag featuring traditional diamond motif embroidery and interior laptop sleeve.',
    basePrice: 2450,
    discountPrice: 2150,
    tag: '-12%',
    stockQuantity: 15,
    imageUrls: ['bags'],
    sizes: [] as string[],
    department: 'Accessories',
    categorySlug: 'bags',
    isFeatured: false,
  },
  {
    title: 'Oxidized Silver Jhumka & Bangles',
    slug: 'oxidized-silver-jhumka-bangles',
    description:
      'Handcrafted oxidized silver crescent jhumka earrings paired with deep maroon artisanal glass bangles.',
    basePrice: 950,
    discountPrice: null,
    tag: 'New',
    stockQuantity: 40,
    imageUrls: ['jewelry'],
    sizes: [] as string[],
    department: 'Accessories',
    categorySlug: 'jewellery',
    isFeatured: false,
  },
  {
    title: 'Nakshi Kantha Cushion Set',
    slug: 'nakshi-kantha-cushion-set',
    description:
      'Set of two hand-stitched Bangladeshi Nakshi Kantha cotton cushion covers in deep maroon and natural ivory.',
    basePrice: 1950,
    discountPrice: null,
    tag: null,
    stockQuantity: 18,
    imageUrls: ['homedecor'],
    sizes: [] as string[],
    department: 'Accessories',
    categorySlug: 'home-decor',
    isFeatured: false,
  },
];

let seedPromise: Promise<void> | null = null;

export async function ensureDatabaseSeeded(): Promise<void> {
  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = (async () => {
    try {
      const [{ value: catCount }] = await db.select({ value: count() }).from(categories);
      if (Number(catCount) === 0) {
        await db
          .insert(categories)
          .values(SEED_CATEGORIES)
          .onConflictDoNothing({ target: categories.slug });
      }

      const allCategories = await db.select().from(categories);
      const slugToId = new Map(allCategories.map((c) => [c.slug, c.id]));

      const [{ value: prodCount }] = await db.select({ value: count() }).from(products);
      if (Number(prodCount) === 0) {
        const productRows = SEED_PRODUCTS.map((p) => ({
          title: p.title,
          slug: p.slug,
          description: p.description,
          basePrice: p.basePrice,
          discountPrice: p.discountPrice,
          tag: p.tag,
          stockQuantity: p.stockQuantity,
          imageUrls: p.imageUrls,
          sizes: p.sizes,
          department: p.department,
          categoryId: slugToId.get(p.categorySlug) ?? allCategories[0].id,
          isFeatured: p.isFeatured,
        }));

        await db
          .insert(products)
          .values(productRows)
          .onConflictDoNothing({ target: products.slug });
      }

      const [{ value: adminCount }] = await db.select({ value: count() }).from(adminUsers);
      if (Number(adminCount) === 0) {
        const defaultEmail = process.env.ADMIN_EMAIL || 'admin@18aana.com';
        const defaultPass = process.env.ADMIN_PASSWORD || 'Admin@18aana2026';
        const passwordHash = await bcrypt.hash(defaultPass, 12);
        await db
          .insert(adminUsers)
          .values({
            email: defaultEmail.toLowerCase(),
            passwordHash,
            name: '18 aana Store Admin',
            role: 'super_admin',
          })
          .onConflictDoNothing({ target: adminUsers.email });
      }

      const [{ value: fbCount }] = await db.select({ value: count() }).from(feedbacks);
      if (Number(fbCount) === 0) {
        await db.insert(feedbacks).values([
          {
            name: 'Rafi, Mirpur',
            topic: 'Product quality',
            rating: 5,
            message: 'The punjabi fit perfectly and arrived in two days.',
          },
          {
            name: 'Nusrat, Chattogram',
            topic: 'Delivery',
            rating: 5,
            message: 'Lovely shawl, the color is exactly like the photo.',
          },
        ]);
      }
    } catch (error) {
      seedPromise = null;
      console.error('Database seed failed:', error);
      throw new Error('Database initialization failed.', { cause: error });
    }
  })();

  return seedPromise;
}

// Allow running directly via `npx tsx src/db/seed.ts`
const isDirectRun =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1]?.endsWith('seed.ts');

if (isDirectRun) {
  import('dotenv/config')
    .then(() => ensureDatabaseSeeded())
    .then(() => {
      console.log('18 aana PostgreSQL database seeded successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
