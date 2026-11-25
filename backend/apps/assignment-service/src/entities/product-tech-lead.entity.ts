import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Master data: Product → vertical → default Tech Lead (maintained by authorized users). */
@Entity('product_tech_leads')
export class ProductTechLead {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'product_tsp', type: 'varchar', length: 128, unique: true })
  productTsp: string;

  @Column({ type: 'varchar', length: 16, default: 'TSP' })
  vertical: string;

  @Column({ name: 'tech_lead_user_id', type: 'bigint', unsigned: true, nullable: true })
  techLeadUserId: string | null;

  @Column({ name: 'tech_lead_name', type: 'varchar', length: 255, nullable: true })
  techLeadName: string | null;

  @Column({ type: 'bool', default: true })
  active: boolean;

  @Column({ name: 'updated_by_user_id', type: 'bigint', unsigned: true, nullable: true })
  updatedByUserId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}
