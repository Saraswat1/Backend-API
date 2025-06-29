import { IsEnum } from 'class-validator';

export class UpdateScheduleTypeDto {
  @IsEnum(['stream', 'wave'])
  stream_type: 'stream' | 'wave';
}
