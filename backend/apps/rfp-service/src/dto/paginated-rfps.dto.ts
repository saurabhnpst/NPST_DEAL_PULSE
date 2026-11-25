import { Rfp } from '../entities/rfp.entity';

export interface PaginatedRfpsDto {
  data: Rfp[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}