import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * A single, flexible collection so you can "add anything" in one place.
 * Every entry is a Markdown file in /content/notes with a small frontmatter header.
 *
 * - Give it a `url` and it becomes a saved link / bookmark.
 * - Set `type` to categorise (note, idea, task, routine, reference, doc...).
 * - Set `public: false` to hide it from the published website.
 */
const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './content/notes' }),
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()).default([]),
    type: z
      .enum(['note', 'link', 'idea', 'task', 'routine', 'reference', 'doc'])
      .default('note'),
    /** Optional external link — present it as a bookmark card. */
    url: z.string().url().optional(),
    /** Optional attachment (e.g. a PDF hosted in a GitHub Release). */
    attachment: z.string().url().optional(),
    /** Hidden from the built site when false. */
    public: z.boolean().default(true),
    /** Pin to the top of the dashboard. */
    pinned: z.boolean().default(false),
    created: z.coerce.date().optional(),
    updated: z.coerce.date().optional(),
  }),
});

export const collections = { notes };
