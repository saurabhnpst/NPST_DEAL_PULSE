import dataSource from '../database/data-source';
import {
  PDF_EXTRACTION_METHOD,
  PDF_PROCESSING_STATUS,
} from '../common/constants/pdf-processing-status.constants';
import { Rfp } from '../entities/rfp.entity';
import { RfpPdfPageText } from '../entities/rfp-pdf-page-text.entity';
import { RfpPdfProcessingJob } from '../entities/rfp-pdf-processing-job.entity';

describe('PDF processing persistence (database integration)', () => {
  const createdJobIds: string[] = [];
  const createdRfpIds: string[] = [];
  const documentId = '88888888-8888-4888-8888-888888888888';

  beforeAll(async () => {
    await dataSource.initialize();
    const db = await dataSource.query('SELECT DATABASE() AS db_name');
    if (db[0]?.db_name !== 'rfp_db') {
      throw new Error(
        `Integration tests require DB_NAME=rfp_db (got ${db[0]?.db_name})`,
      );
    }
    const table = await dataSource.query(
      "SHOW TABLES LIKE 'rfp_pdf_processing_jobs'",
    );
    if (table.length === 0) {
      throw new Error(
        'Missing rfp_pdf_processing_jobs. Run npm run migration:run:rfp first.',
      );
    }
  });

  afterAll(async () => {
    const pageRepo = dataSource.getRepository(RfpPdfPageText);
    const jobRepo = dataSource.getRepository(RfpPdfProcessingJob);
    const rfpRepo = dataSource.getRepository(Rfp);

    if (createdJobIds.length > 0) {
      await pageRepo
        .createQueryBuilder()
        .delete()
        .where('job_id IN (:...ids)', { ids: createdJobIds })
        .execute();
      await jobRepo.delete(createdJobIds);
    }
    if (createdRfpIds.length > 0) {
      await rfpRepo.delete(createdRfpIds);
    }
    await dataSource.destroy();
  });

  it('preserves attempt history and page rows per job', async () => {
    const rfpRepo = dataSource.getRepository(Rfp);
    const jobRepo = dataSource.getRepository(RfpPdfProcessingJob);
    const pageRepo = dataSource.getRepository(RfpPdfPageText);

    const rfp = await rfpRepo.save(
      rfpRepo.create({
        title: 'PDF processing integration RFP',
        documentId,
        leadId: '77777777-7777-4777-8777-777777777777',
      }),
    );
    createdRfpIds.push(rfp.id);

    const attempt1 = await jobRepo.save(
      jobRepo.create({
        rfpId: rfp.id,
        documentId,
        attempt: 1,
        status: PDF_PROCESSING_STATUS.COMPLETED,
        pageCount: 2,
        processedPageCount: 2,
        failedPageCount: 0,
      }),
    );
    createdJobIds.push(attempt1.id);

    await pageRepo.upsert(
      {
        jobId: attempt1.id,
        pageNumber: 1,
        extractionMethod: PDF_EXTRACTION_METHOD.EMBEDDED,
        charCount: 42,
        hasUsableText: true,
        textContent: 'Attempt one page text',
        ocrConfidence: null,
        metadataJson: { source: 'pdfjs' },
      },
      ['jobId', 'pageNumber'],
    );

    const attempt2 = await jobRepo.save(
      jobRepo.create({
        rfpId: rfp.id,
        documentId,
        attempt: 2,
        status: PDF_PROCESSING_STATUS.COMPLETED,
        pageCount: 2,
        processedPageCount: 2,
        failedPageCount: 0,
      }),
    );
    createdJobIds.push(attempt2.id);

    await pageRepo.upsert(
      {
        jobId: attempt2.id,
        pageNumber: 1,
        extractionMethod: PDF_EXTRACTION_METHOD.OCR,
        charCount: 50,
        hasUsableText: true,
        textContent: 'Attempt two page text',
        ocrConfidence: 91.5,
        metadataJson: { source: 'tesseract' },
      },
      ['jobId', 'pageNumber'],
    );

    const latest = await jobRepo.findOne({
      where: { rfpId: rfp.id, documentId },
      order: { attempt: 'DESC' },
    });
    expect(latest?.attempt).toBe(2);

    const attempts = await jobRepo.find({
      where: { rfpId: rfp.id, documentId },
      order: { attempt: 'ASC' },
    });
    expect(attempts).toHaveLength(2);

    const attemptOnePages = await pageRepo.find({
      where: { jobId: attempt1.id },
    });
    const attemptTwoPages = await pageRepo.find({
      where: { jobId: attempt2.id },
    });
    expect(attemptOnePages[0]?.textContent).toContain('Attempt one');
    expect(attemptTwoPages[0]?.textContent).toContain('Attempt two');
  });
});