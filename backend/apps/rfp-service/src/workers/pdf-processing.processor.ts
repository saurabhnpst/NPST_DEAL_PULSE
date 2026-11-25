import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PDF_PROCESSING_QUEUE } from '../common/constants/pdf-processing-status.constants';
import {
  PdfProcessingExecutionService,
  PdfQueueJobPayload,
} from '../pdf-processing/pdf-processing-execution.service';

const PDF_WORKER_CONCURRENCY = Math.max(
  1,
  Number(process.env.PDF_PROCESSING_WORKER_CONCURRENCY ?? 1),
);

@Processor(PDF_PROCESSING_QUEUE, {
  concurrency: PDF_WORKER_CONCURRENCY,
})
export class PdfProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfProcessingProcessor.name);

  constructor(private readonly executionService: PdfProcessingExecutionService) {
    super();
  }

  async process(job: Job<PdfQueueJobPayload>): Promise<void> {
    this.logger.log(
      `Processing BullMQ job id=${job.id} processingJobId=${job.data.processingJobId}`,
    );
    await this.executionService.execute(job.data);
  }
}