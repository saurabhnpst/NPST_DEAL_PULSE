import { AmountField, DateField, LongTextField } from '../../common/validation';

/** PATCH /opportunities/:id/revenue (same rules as the main PATCH). */
export class UpdateRevenueDto {
  @AmountField(false) arr?: number;
  @AmountField(false) oneTime?: number;
  @AmountField() updatedArr?: number | null;
  @AmountField() year2?: number | null;
  @AmountField() year3?: number | null;
  @AmountField() year4?: number | null;
  @AmountField() year5?: number | null;
  @DateField() updatedCloseDate?: string | null;
  @DateField() latestFollowupDate?: string | null;
  @LongTextField() followupDetails?: string | null;
}
