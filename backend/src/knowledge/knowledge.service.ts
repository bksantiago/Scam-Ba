import { Injectable } from '@nestjs/common';
import seed from './scam-stories.seed.json';
import type { ScamStory, StoryRole } from './scam-story.types';
import { overlapScore, tokenSet } from '../analysis/text.util';

export type AppRole = 'buying' | 'selling';

/**
 * The scam-story knowledge base.
 *
 * Today this is an in-memory keyword-overlap retriever over a seed JSON file.
 * This class is the RAG seam: `retrieve()` is where pgvector cosine-similarity
 * search will plug in (embed the query, ANN search the `scam_stories` table).
 * The rest of the app only depends on its signature, so the swap is local.
 */
@Injectable()
export class KnowledgeService {
  private readonly stories: ScamStory[] = seed as ScamStory[];

  all(): ScamStory[] {
    return this.stories;
  }

  forRole(role: AppRole): ScamStory[] {
    return this.stories.filter((s) => s.role === role || s.role === 'both');
  }

  /** Top-k stories most relevant to a free-text situation, scoped to role. */
  retrieve(query: string, role: AppRole, k = 4): ScamStory[] {
    const q = tokenSet(query);
    const scoped = this.forRole(role);
    return scoped
      .map((story) => ({
        story,
        score: overlapScore(q, tokenSet(searchableText(story))),
      }))
      .sort(
        (a, b) =>
          b.score - a.score || b.story.severity - a.story.severity,
      )
      .slice(0, k)
      .map((r) => r.story);
  }
}

function searchableText(s: ScamStory): string {
  return [s.title, s.narrative, s.category, ...s.redFlags, ...s.tags].join(' ');
}
