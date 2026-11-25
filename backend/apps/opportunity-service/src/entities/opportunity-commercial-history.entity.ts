import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CommercialLineJson, Opportunity } from './opportunity.entity';

export type CommercialHistoryLineJson = {
  id: string;
  t: string;
  q: number;
  unit_price: number;
};

@Entity('opportunity_commercial_history')
export class OpportunityCommercialHistory {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'opportunity_id', type: 'bigint', unsigned: true })
  opportunityId: string;

  @Column({ name: 'version_label', type: 'varchar', length: 128 })
  versionLabel: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  licence: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  milestones: string | null;

  @Column({ name: 'amc_term', type: 'varchar', length: 16, nullable: true })
  amcTerm: string | null;

  @Column({ name: 'line_items', type: 'json' })
  lineItems: CommercialHistoryLineJson[] | CommercialLineJson[];

  @Column({ name: 'created_by_user_id', type: 'bigint', unsigned: true, nullable: true })
  createdByUserId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @ManyToOne(() => Opportunity, (o) => o.commercialHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opportunity_id' })
  opportunity: Opportunity;
}