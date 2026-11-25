import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Outbox: events saved in the same transaction as the change.
 * A RabbitMQ publisher (later) sends rows where published_at IS NULL.
 */
@Entity('assignment_domain_events')
export class AssignmentDomainEvent {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'event_type', type: 'varchar', length: 64 })
  eventType: string;

  @Column({ name: 'subject_type', type: 'varchar', length: 32 })
  subjectType: string;

  @Column({ name: 'subject_id', type: 'bigint', unsigned: true })
  subjectId: string;

  @Column({ name: 'opportunity_id', type: 'varchar', length: 32, nullable: true })
  opportunityId: string | null;

  @Column({ type: 'json' })
  payload: Record<string, unknown>;

  @Column({ name: 'occurred_at', type: 'datetime', precision: 6 })
  occurredAt: Date;

  @Column({ name: 'published_at', type: 'datetime', precision: 6, nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;
}
