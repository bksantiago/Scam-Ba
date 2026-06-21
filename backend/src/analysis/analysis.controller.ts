import { Body, Controller, Post } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalyzeDto } from './dto/analyze.dto';
import type { AnalyzeResult } from './analysis.types';

@Controller('analyze')
export class AnalysisController {
  constructor(private readonly analysis: AnalysisService) {}

  @Post()
  analyze(@Body() dto: AnalyzeDto): Promise<AnalyzeResult> {
    return this.analysis.analyze({
      role: dto.role,
      description: dto.description ?? '',
      signals: dto.signals ?? [],
      history: dto.history ?? [],
    });
  }
}
