import { RefIdField } from '../../common/validation';

export class StageActorDto {
  /** Fallback when the `x-user-id` header is missing. */
  @RefIdField() changedByUserId?: number;
}
