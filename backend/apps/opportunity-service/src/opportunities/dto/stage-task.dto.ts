import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** Side panel task (`tasks[]` in the frontend, `stageTasks` in the API). */
export class StageTaskDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  t: string;

  @IsString()
  @IsNotEmpty()
  due: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  o: string;

  @IsBoolean()
  done: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  stage?: string;

  /** Time the Teams notification was sent (display only). */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  teamsAt?: string;
}

/** Side panel deal team member (`people[]` in the frontend, `dealTeam` in the API). */
export class DealTeamMemberDto {
  @IsString()
  @MaxLength(255)
  n: string;

  @IsString()
  @MaxLength(255)
  r: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  teamsAt?: string;
}
