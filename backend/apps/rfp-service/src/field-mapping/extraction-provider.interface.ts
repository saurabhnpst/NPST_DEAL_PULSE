export interface PageTextInput {
  pageNumber: number;
  text: string;
}

export interface RawExtractedCandidate {
  fieldKey: string;
  value: string;
  pageNumber: number;
  sourceExcerpt: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface FieldExtractionProvider {
  readonly providerId: string;
  extract(
    pages: PageTextInput[],
    fieldPatterns: Array<{
      fieldKey: string;
      patterns: string[];
    }>,
  ): RawExtractedCandidate[];
}