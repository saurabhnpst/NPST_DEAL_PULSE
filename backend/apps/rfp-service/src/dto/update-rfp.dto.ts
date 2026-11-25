import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateRfpDto } from './create-rfp.dto';

export class UpdateRfpDto extends PartialType(CreateRfpDto) {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastModifiedById?: string;
}