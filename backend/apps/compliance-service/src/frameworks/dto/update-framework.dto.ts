import { PartialType } from '@nestjs/swagger';
import { FrameworkFieldsDto } from './framework-fields.dto';

export class UpdateFrameworkDto extends PartialType(FrameworkFieldsDto) {}