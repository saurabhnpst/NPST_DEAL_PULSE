import { registerAs } from '@nestjs/config';

export interface InformationExtractionConfig {
  queueName: string;
  workerConcurrency: number;
  minConfidence: number;
  queueRetryAttempts: number;
  queueRetryBackoffMs: number;
}

export default registerAs(
  'informationExtraction',
  (): InformationExtractionConfig => ({
    queueName:
      process.env.RFP_EXTRACTION_QUEUE_NAME ?? 'rfp-information-extraction',
    workerConcurrency: Number(
      process.env.RFP_EXTRACTION_WORKER_CONCURRENCY ?? 1,
    ),
    minConfidence: Number(process.env.RFP_EXTRACTION_MIN_CONFIDENCE ?? 0.55),
    queueRetryAttempts: Number(
      process.env.RFP_EXTRACTION_QUEUE_RETRY_ATTEMPTS ?? 3,
    ),
    queueRetryBackoffMs: Number(
      process.env.RFP_EXTRACTION_QUEUE_RETRY_BACKOFF_MS ?? 5_000,
    ),
  }),
);