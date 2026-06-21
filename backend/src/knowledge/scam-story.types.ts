export type StoryRole = 'buying' | 'selling' | 'both';

/** One known scam pattern in the knowledge base. */
export interface ScamStory {
  id: string;
  title: string;
  role: StoryRole;
  category: string;
  platform: string;
  narrative: string;
  redFlags: string[];
  saferAlternative: string;
  /** 1 (minor) – 5 (severe). */
  severity: number;
  tags: string[];
  source: string;
}
