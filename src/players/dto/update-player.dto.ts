import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PlayerPosition } from '../../common/enums/player-position.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePlayerDto {
  @ApiProperty({
    description: 'Name of the player.',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Position of the player.',
    example: 'DEF',
  })
  @IsOptional()
  @IsEnum(PlayerPosition)
  position?: PlayerPosition;
}
