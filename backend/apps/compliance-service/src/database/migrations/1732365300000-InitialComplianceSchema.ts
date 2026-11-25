import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates all Compliance Service tables in dependency order.
 * Source of truth: apps/compliance-service/src/entities/*.entity.ts
 * Target database: compliance_db only (via data-source.ts).
 */
export class InitialComplianceSchema1732365300000 implements MigrationInterface {
  name = 'InitialComplianceSchema1732365300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`compliance_frameworks\` (
        \`id\` varchar(36) NOT NULL,
        \`code\` varchar(64) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`description\` text NULL,
        \`version\` varchar(32) NULL,
        \`source\` varchar(255) NULL,
        \`status\` varchar(32) NOT NULL DEFAULT 'Active',
        \`applicable_metadata\` json NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`UQ_compliance_frameworks_code\` (\`code\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await queryRunner.query(`
      CREATE TABLE \`compliance_requirements\` (
        \`id\` varchar(36) NOT NULL,
        \`framework_id\` varchar(36) NOT NULL,
        \`code\` varchar(64) NOT NULL,
        \`title\` varchar(500) NOT NULL,
        \`description\` text NULL,
        \`category\` varchar(128) NULL,
        \`criticality\` varchar(64) NULL,
        \`reference_clause\` text NULL,
        \`sort_order\` int NOT NULL DEFAULT 0,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`UQ_compliance_requirements_framework_code\` (\`framework_id\`, \`code\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await queryRunner.query(`
      CREATE TABLE \`compliance_configurations\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`description\` text NULL,
        \`opportunity_id\` varchar(36) NULL,
        \`project_id\` varchar(36) NULL,
        \`product_tsp\` varchar(255) NULL,
        \`status\` varchar(32) NOT NULL DEFAULT 'Active',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await queryRunner.query(`
      CREATE TABLE \`compliance_configuration_frameworks\` (
        \`id\` varchar(36) NOT NULL,
        \`configuration_id\` varchar(36) NOT NULL,
        \`framework_id\` varchar(36) NOT NULL,
        \`sort_order\` int NOT NULL DEFAULT 0,
        UNIQUE INDEX \`UQ_config_framework\` (\`configuration_id\`, \`framework_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await queryRunner.query(`
      CREATE TABLE \`compliance_configuration_requirements\` (
        \`id\` varchar(36) NOT NULL,
        \`configuration_id\` varchar(36) NOT NULL,
        \`requirement_id\` varchar(36) NOT NULL,
        \`sort_order\` int NOT NULL DEFAULT 0,
        UNIQUE INDEX \`UQ_config_requirement\` (\`configuration_id\`, \`requirement_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await queryRunner.query(`
      CREATE TABLE \`compliance_assessments\` (
        \`id\` varchar(36) NOT NULL,
        \`configuration_id\` varchar(36) NOT NULL,
        \`opportunity_id\` varchar(36) NOT NULL,
        \`project_id\` varchar(36) NULL,
        \`name\` varchar(255) NOT NULL,
        \`description\` text NULL,
        \`status\` varchar(32) NOT NULL DEFAULT 'Draft',
        \`started_at\` datetime NULL,
        \`completed_at\` datetime NULL,
        \`created_by_actor_id\` varchar(100) NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await queryRunner.query(`
      CREATE TABLE \`compliance_assessment_lines\` (
        \`id\` varchar(36) NOT NULL,
        \`assessment_id\` varchar(36) NOT NULL,
        \`requirement_id\` varchar(36) NOT NULL,
        \`requirement_code\` varchar(64) NOT NULL,
        \`requirement_title\` varchar(500) NOT NULL,
        \`compliance_status\` varchar(32) NOT NULL DEFAULT 'PENDING',
        \`notes\` text NULL,
        \`reviewer_observations\` text NULL,
        \`sort_order\` int NOT NULL DEFAULT 0,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`UQ_assessment_requirement\` (\`assessment_id\`, \`requirement_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await queryRunner.query(`
      CREATE TABLE \`compliance_evidence_references\` (
        \`id\` varchar(36) NOT NULL,
        \`assessment_line_id\` varchar(36) NOT NULL,
        \`document_id\` varchar(36) NULL,
        \`title\` varchar(255) NOT NULL,
        \`description\` text NULL,
        \`evidence_type\` varchar(64) NULL,
        \`reference_url\` varchar(2048) NULL,
        \`reference_metadata\` json NULL,
        \`created_by_actor_id\` varchar(100) NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await queryRunner.query(`
      CREATE TABLE \`compliance_assessment_reviews\` (
        \`id\` varchar(36) NOT NULL,
        \`assessment_id\` varchar(36) NOT NULL,
        \`reviewer_actor_id\` varchar(100) NULL,
        \`comments\` text NULL,
        \`decision\` varchar(32) NULL,
        \`submitted_at\` datetime NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await queryRunner.query(`
      CREATE TABLE \`compliance_assessment_signoffs\` (
        \`id\` varchar(36) NOT NULL,
        \`assessment_id\` varchar(36) NOT NULL,
        \`decision\` varchar(32) NOT NULL,
        \`comments\` text NULL,
        \`signer_actor_id\` varchar(100) NULL,
        \`signed_off_at\` datetime NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`UQ_assessment_signoff\` (\`assessment_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await queryRunner.query(`
      ALTER TABLE \`compliance_requirements\`
      ADD CONSTRAINT \`FK_compliance_requirements_framework\`
      FOREIGN KEY (\`framework_id\`) REFERENCES \`compliance_frameworks\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`compliance_configuration_frameworks\`
      ADD CONSTRAINT \`FK_ccf_configuration\`
      FOREIGN KEY (\`configuration_id\`) REFERENCES \`compliance_configurations\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`compliance_configuration_frameworks\`
      ADD CONSTRAINT \`FK_ccf_framework\`
      FOREIGN KEY (\`framework_id\`) REFERENCES \`compliance_frameworks\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`compliance_configuration_requirements\`
      ADD CONSTRAINT \`FK_ccr_configuration\`
      FOREIGN KEY (\`configuration_id\`) REFERENCES \`compliance_configurations\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`compliance_configuration_requirements\`
      ADD CONSTRAINT \`FK_ccr_requirement\`
      FOREIGN KEY (\`requirement_id\`) REFERENCES \`compliance_requirements\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`compliance_assessments\`
      ADD CONSTRAINT \`FK_compliance_assessments_configuration\`
      FOREIGN KEY (\`configuration_id\`) REFERENCES \`compliance_configurations\`(\`id\`)
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`compliance_assessment_lines\`
      ADD CONSTRAINT \`FK_cal_assessment\`
      FOREIGN KEY (\`assessment_id\`) REFERENCES \`compliance_assessments\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`compliance_assessment_lines\`
      ADD CONSTRAINT \`FK_cal_requirement\`
      FOREIGN KEY (\`requirement_id\`) REFERENCES \`compliance_requirements\`(\`id\`)
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`compliance_evidence_references\`
      ADD CONSTRAINT \`FK_evidence_assessment_line\`
      FOREIGN KEY (\`assessment_line_id\`) REFERENCES \`compliance_assessment_lines\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`compliance_assessment_reviews\`
      ADD CONSTRAINT \`FK_reviews_assessment\`
      FOREIGN KEY (\`assessment_id\`) REFERENCES \`compliance_assessments\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`compliance_assessment_signoffs\`
      ADD CONSTRAINT \`FK_signoffs_assessment\`
      FOREIGN KEY (\`assessment_id\`) REFERENCES \`compliance_assessments\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`compliance_assessment_signoffs\` DROP FOREIGN KEY \`FK_signoffs_assessment\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`compliance_assessment_reviews\` DROP FOREIGN KEY \`FK_reviews_assessment\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`compliance_evidence_references\` DROP FOREIGN KEY \`FK_evidence_assessment_line\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`compliance_assessment_lines\` DROP FOREIGN KEY \`FK_cal_requirement\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`compliance_assessment_lines\` DROP FOREIGN KEY \`FK_cal_assessment\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`compliance_assessments\` DROP FOREIGN KEY \`FK_compliance_assessments_configuration\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`compliance_configuration_requirements\` DROP FOREIGN KEY \`FK_ccr_requirement\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`compliance_configuration_requirements\` DROP FOREIGN KEY \`FK_ccr_configuration\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`compliance_configuration_frameworks\` DROP FOREIGN KEY \`FK_ccf_framework\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`compliance_configuration_frameworks\` DROP FOREIGN KEY \`FK_ccf_configuration\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`compliance_requirements\` DROP FOREIGN KEY \`FK_compliance_requirements_framework\``,
    );

    await queryRunner.query(`DROP TABLE \`compliance_assessment_signoffs\``);
    await queryRunner.query(`DROP TABLE \`compliance_assessment_reviews\``);
    await queryRunner.query(`DROP TABLE \`compliance_evidence_references\``);
    await queryRunner.query(`DROP TABLE \`compliance_assessment_lines\``);
    await queryRunner.query(`DROP TABLE \`compliance_assessments\``);
    await queryRunner.query(`DROP TABLE \`compliance_configuration_requirements\``);
    await queryRunner.query(`DROP TABLE \`compliance_configuration_frameworks\``);
    await queryRunner.query(`DROP TABLE \`compliance_configurations\``);
    await queryRunner.query(`DROP TABLE \`compliance_requirements\``);
    await queryRunner.query(`DROP TABLE \`compliance_frameworks\``);
  }
}