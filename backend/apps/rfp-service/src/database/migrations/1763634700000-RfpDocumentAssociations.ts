import { MigrationInterface, QueryRunner } from 'typeorm';

export class RfpDocumentAssociations1763634700000 implements MigrationInterface {
  name = 'RfpDocumentAssociations1763634700000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`rfp_document_associations\` (
        \`id\` varchar(36) NOT NULL,
        \`document_id\` char(36) NOT NULL,
        \`rfp_id\` char(36) NOT NULL,
        \`lead_id\` char(36) NULL,
        \`document_name\` varchar(255) NULL,
        \`document_type\` varchar(100) NULL,
        \`uploaded_at\` datetime NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`UQ_rfp_document_assoc_rfp_document\` (\`rfp_id\`, \`document_id\`),
        INDEX \`IDX_rfp_document_assoc_document_id\` (\`document_id\`),
        INDEX \`IDX_rfp_document_assoc_lead_id\` (\`lead_id\`)
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`rfp_document_associations\``);
  }
}