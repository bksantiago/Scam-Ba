import { Injectable, Logger } from '@nestjs/common';
import { KnowledgeService } from '../knowledge/knowledge.service';
import type { AnalyzeInput, AnalyzeResult } from './analysis.types';
import { heuristicAnalyze } from './heuristic-analyzer';
import { ClaudeAnalyzer } from './claude-analyzer';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);
  private readonly claude = process.env.ANTHROPIC_API_KEY
    ? new ClaudeAnalyzer()
    : null;

  constructor(private readonly knowledge: KnowledgeService) {}

  async analyze(input: AnalyzeInput): Promise<AnalyzeResult> {
    const query = [input.description, ...(input.signals ?? [])].join(' ');

    // RAG step: retrieve the most relevant known scams (keyword overlap today,
    // pgvector similarity later — see KnowledgeService.retrieve).
    const retrieved = this.knowledge.retrieve(query, input.role, 6);

    // Claude when configured; the offline heuristic otherwise (and as fallback).
    if (this.claude) {
      try {
        return await this.claude.analyze(input, retrieved);
      } catch (err) {
        this.logger.warn(
          `Claude analyzer failed, falling back to heuristic: ${String(err)}`,
        );
      }
    }

    return heuristicAnalyze(input, this.knowledge.forRole(input.role));
  }
}
