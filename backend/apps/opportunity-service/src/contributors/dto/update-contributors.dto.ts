import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { RefIdField, TextField } from '../../common/validation';
import { DealTeamMemberDto } from '../../opportunities/dto/stage-task.dto';

/** PATCH /opportunities/:id/contributors (same rules as the main PATCH). */
export class UpdateContributorsDto {
  @RefIdField() ownerUserId?: number | null;
  @RefIdField() presalesUserId?: number | null;
  @TextField(255) presalesName?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DealTeamMemberDto)
  dealTeam?: DealTeamMemberDto[] | null;
}
