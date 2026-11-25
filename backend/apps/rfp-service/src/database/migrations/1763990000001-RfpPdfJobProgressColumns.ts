import { MigrationInterface, QueryRunner } from 'typeorm';

export class RfpPdfJobProgressColumns1763990000001
  implements MigrationInterface
{
  name = 'RfpPdfJobProgressColumns1763990000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`rfp_pdf_processing_jobs\`
        ADD COLUMN \`processed_page_count\` int NOT NULL DEFAULT 0 AFTER \`page_count\`,
        ADD COLUMN \`failed_page_count\` int NOT NULL DEFAULT 0 AFTER \`processed_page_count\`
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`rfp_pdf_processing_jobs\`
        DROP COLUMN \`failed_page_count\`,
        DROP COLUMN \`processed_page_count\`
    `);
  }
}