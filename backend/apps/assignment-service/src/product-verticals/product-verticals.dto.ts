import { ActorDto, ChoiceField, FlagField, RefIdField, RequiredText } from '../common/validation';
import { VERTICALS } from '../common/statuses';

/** POST /product-verticals: add a product to the master. */
export class CreateProductTechLeadDto extends ActorDto {
  /** Same product names as the opportunity product picklist, e.g. "UPI", "BBPS". */
  @RequiredText(128) productTsp: string;

  /** Default TSP. */
  @ChoiceField(VERTICALS, false) vertical?: string;

  @RefIdField('Default Tech Lead (Auth user id)') techLeadUserId?: number | null;

  /** Default true. */
  @FlagField() active?: boolean;
}

/** PATCH /product-verticals/:id: change vertical, default Tech Lead or active flag. */
export class UpdateProductTechLeadDto extends ActorDto {
  @ChoiceField(VERTICALS, false) vertical?: string;

  /** null = no default Tech Lead (new requirements for this product then go to review). */
  @RefIdField('Default Tech Lead (Auth user id)') techLeadUserId?: number | null;

  @FlagField() active?: boolean;
}
