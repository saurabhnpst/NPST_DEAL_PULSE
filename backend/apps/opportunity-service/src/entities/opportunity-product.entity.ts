import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Opportunity } from './opportunity.entity';

@Entity('opportunity_products')
export class OpportunityProduct {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'opportunity_id', type: 'bigint', unsigned: true })
  opportunityId: string;

  @Column({ name: 'product_slot', type: 'tinyint', unsigned: true })
  productSlot: number;

  @Column({ name: 'product_tsp', type: 'varchar', length: 128 })
  productTsp: string;

  @Column({ type: 'json' })
  modules: string[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;

  @ManyToOne(() => Opportunity, (o) => o.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opportunity_id' })
  opportunity: Opportunity;
}