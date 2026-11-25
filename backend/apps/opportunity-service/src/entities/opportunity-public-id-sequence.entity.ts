import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('opportunity_public_id_sequences')
export class OpportunityPublicIdSequence {
  @PrimaryColumn({ type: 'smallint', unsigned: true })
  year: number;

  @Column({ name: 'last_number', type: 'int', unsigned: true, default: 0 })
  lastNumber: number;
}