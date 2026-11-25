import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Opportunity } from './opportunity.entity';

export type OpportunityActivityKind = 'Call' | 'Meeting' | 'Email' | 'Note' | 'System';

@Entity('opportunity_activities')
export class OpportunityActivity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'opportunity_id', type: 'bigint', unsigned: true })
  opportunityId: string;

  @Column({ name: 'activity_kind', type: 'varchar', length: 16 })
  activityKind: OpportunityActivityKind;

  @Column({ name: 'with_party', type: 'varchar', length: 255, nullable: true })
  withParty: string | null;

  @Column({ type: 'text' })
  summary: string;

  @Column({ name: 'actor_user_id', type: 'bigint', unsigned: true, nullable: true })
  actorUserId: string | null;

  @Column({ name: 'actor_label', type: 'varchar', length: 255, nullable: true })
  actorLabel: string | null;

  @Column({ name: 'occurred_at', type: 'datetime', precision: 6 })
  occurredAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @ManyToOne(() => Opportunity, (o) => o.activities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opportunity_id' })
  opportunity: Opportunity;
}