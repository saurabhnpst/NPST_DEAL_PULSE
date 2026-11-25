import { Injectable } from '@nestjs/common';
import {
  FieldExtractionProvider,
  PageTextInput,
  RawExtractedCandidate,
} from './extraction-provider.interface';

@Injectable()
export class RuleBasedExtractorService implements FieldExtractionProvider {
  readonly providerId = 'rule-based-v1';

  extract(
    pages: PageTextInput[],
    fieldPatterns: Array<{ fieldKey: string; patterns: string[] }>,
  ): RawExtractedCandidate[] {
    const results: RawExtractedCandidate[] = [];

    for (const field of fieldPatterns) {
      let best: RawExtractedCandidate | null = null;

      for (const page of pages) {
        if (!page.text?.trim()) {
          continue;
        }
        for (const pattern of field.patterns) {
          try {
            const regex = new RegExp(pattern, 'i');
            const match = regex.exec(page.text);
            if (!match?.[0]) {
              continue;
            }
            const value = (match[1] ?? match[0]).replace(/\s+/g, ' ').trim();
            if (value.length < 2) {
              continue;
            }
            const confidence = this.scoreMatch(value, pattern);
            const excerpt = this.buildExcerpt(page.text, match.index ?? 0);
            const candidate: RawExtractedCandidate = {
              fieldKey: field.fieldKey,
              value,
              pageNumber: page.pageNumber,
              sourceExcerpt: excerpt,
              confidence,
            };
            if (!best || candidate.confidence > best.confidence) {
              best = candidate;
            }
          } catch {
            /* invalid regex in config — skip */
          }
        }
      }

      if (best) {
        results.push(best);
      }
    }

    return results;
  }

  private scoreMatch(value: string, pattern: string): number {
    let score = 0.55;
    if (value.length >= 8) {
      score += 0.1;
    }
    if (value.length >= 20) {
      score += 0.05;
    }
    if (pattern.includes('(?<')) {
      score += 0.1;
    }
    return Math.min(score, 0.95);
  }

  private buildExcerpt(text: string, startIndex: number): string {
    const start = Math.max(0, startIndex - 80);
    const end = Math.min(text.length, startIndex + 220);
    return text.slice(start, end).replace(/\s+/g, ' ').trim();
  }
}