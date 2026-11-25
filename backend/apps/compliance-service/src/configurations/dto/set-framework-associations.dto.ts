import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class SetFrameworkAssociationsDto {
  @ApiProperty({
    type: [String],
    description: 'Replaces all framework associations for this configuration',
    example: [
      'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
      'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
    ],
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  frameworkIds: string[];
}