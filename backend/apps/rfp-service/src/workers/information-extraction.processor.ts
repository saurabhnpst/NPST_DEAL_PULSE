import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RFP_EXTRACTION_QUEUE } from '../common/constants/rfp-extraction.constants';
import {
  InformationExtractionQueuePayload,
  RfpExtractionExecutionService,
} from '../information-extraction/rfp-extraction-execution.service';

const WORKER_CONCURRENCY = Math.max(
  1,
  Number(process.env.RFP_EXTRACTION_WORKER_CONCURRENCY ?? 1),
);

@Processor(RFP_EXTRACTION_QUEUE, { concurrency: WORKER_CONCURRENCY })
export class InformationExtractionProcessor extends WorkerHost {
  private readonly logger = new Logger(InformationExtractionProcessor.name);

  constructor(private readonly execution: RfpExtractionExecutionService) {
    super();
  }

  async process(job: Job<InformationExtractionQueuePayload>): Promise<void> {
    this.logger.log(`Information extraction job id=${job.id}`);
    await this.execution.execute(job.data);
  }
}