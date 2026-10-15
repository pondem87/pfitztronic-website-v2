import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blogs = defineCollection({
  loader: glob({ base: './src/content/blogs', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().optional(),
    description: z.string(),
    published: z.coerce.date(),
    image: z.string(),
    imageAlt: z.string(),
    author: z.string(),
    authorImage: z.string().optional(),
    authorBio: z.string().optional(),
    cta: z.object({ heading: z.string(), text: z.string() }).optional(),
  }),
});

const services = defineCollection({
  loader: glob({ base: './src/content/services', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().int().positive(),
    image: z.string(),
    imageAlt: z.string().default(''),
    pricing: z.object({
      eyebrow: z.string().default('Pricing & Engagement'),
      title: z.string().default('A Scope That Fits Your Needs'),
      currency: z.string().default(''),
      plans: z.array(z.object({
        name: z.string(),
        price: z.string(),
        period: z.string().optional(),
        description: z.string().optional(),
        featured: z.boolean().default(false),
        href: z.string().default('/contact/'),
        features: z.array(z.object({
          label: z.string(),
          included: z.boolean().default(true),
        })),
      })).min(1),
    }).optional(),
  }),
});

export const collections = { blogs, services };
