import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('opportunity_domain_events')
export class OpportunityDomainEvent {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'opportunity_id', type: 'bigint', unsigned: true })
  opportunityId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 64 })
  eventType: string;

  @Column({ name: 'schema_version', type: 'smallint', unsigned: true, default: 1 })
  schemaVersion: number;

  @Column({ type: 'json' })
  payload: Record<string, unknown>;

  @Column({ name: 'correlation_id', type: 'varchar', length: 64, nullable: true })
  correlationId: string | null;

  @Column({ name: 'occurred_at', type: 'datetime', precision: 6 })
  occurredAt: Date;

  @Column({ name: 'published_at', type: 'datetime', precision: 6, nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;
}