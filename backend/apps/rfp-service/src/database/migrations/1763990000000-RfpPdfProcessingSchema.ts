import { MigrationInterface, QueryRunner } from 'typeorm';

export class RfpPdfProcessingSchema1763990000000 implements MigrationInterface {
  name = 'RfpPdfProcessingSchema1763990000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`rfp_pdf_processing_jobs\` (
        \`id\` varchar(36) NOT NULL,
        \`rfp_id\` char(36) NOT NULL,
        \`document_id\` char(36) NOT NULL,
        \`attempt\` int NOT NULL,
        \`status\` varchar(32) NOT NULL,
        \`page_count\` int NULL,
        \`error_code\` varchar(64) NULL,
        \`error_message\` varchar(500) NULL,
        \`source_file_name\` varchar(255) NULL,
        \`source_size_bytes\` bigint NULL,
        \`started_at\` datetime(6) NULL,
        \`completed_at\` datetime(6) NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`UQ_rfp_pdf_job_rfp_doc_attempt\` (\`rfp_id\`, \`document_id\`, \`attempt\`),
        INDEX \`IDX_rfp_pdf_jobs_rfp_id\` (\`rfp_id\`),
        INDEX \`IDX_rfp_pdf_jobs_document_id\` (\`document_id\`),
        INDEX \`IDX_rfp_pdf_jobs_status\` (\`status\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`rfp_pdf_page_texts\` (
        \`id\` varchar(36) NOT NULL,
        \`job_id\` varchar(36) NOT NULL,
        \`page_number\` int NOT NULL,
        \`extraction_method\` varchar(16) NOT NULL,
        \`char_count\` int NOT NULL DEFAULT 0,
        \`has_usable_text\` tinyint NOT NULL DEFAULT 0,
        \`text_content\` longtext NOT NULL,
        \`ocr_confidence\` decimal(5,2) NULL,
        \`metadata_json\` json NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`UQ_rfp_pdf_page_job_page\` (\`job_id\`, \`page_number\`),
        INDEX \`IDX_rfp_pdf_page_job_id\` (\`job_id\`),
        CONSTRAINT \`FK_rfp_pdf_page_job\`
          FOREIGN KEY (\`job_id\`) REFERENCES \`rfp_pdf_processing_jobs\`(\`id\`)
          ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`rfp_pdf_page_texts\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`rfp_pdf_processing_jobs\``);
  }
}