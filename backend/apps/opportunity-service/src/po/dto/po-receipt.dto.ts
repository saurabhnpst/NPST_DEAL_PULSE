import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { AmountField, RefIdField } from '../../common/validation';

/** POST /opportunities/:id/po-receipt */
export class PoReceiptDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  poNumber: string;

  @IsDateString()
  poDate: string;

  /** Defaults to the latest commercial version total. */
  @AmountField() poValue?: number | null;

  /** Document Service id of the uploaded PO file. */
  @RefIdField() poFileDocumentId?: number | null;

  /** Fallback when the `x-user-id` header is missing. */
  @RefIdField() changedByUserId?: number | null;
}
