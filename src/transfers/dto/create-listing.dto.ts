import { IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateListingDto {
  @ApiProperty({
    description: 'ID of the player.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  playerId: string;

  @ApiProperty({
    description: 'Asking price of the transfer listing.',
    example: 10000,
  })
  @IsInt()
  @Min(1)
  askingPrice: number;
}
