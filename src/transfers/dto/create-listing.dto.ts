import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsUUID, Max, Min } from 'class-validator';

export class CreateListingDto {
  @ApiProperty({
    description: 'ID of the player.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'Player ID must be a valid UUID v4' })
  playerId: string;
  @ApiProperty({
    description: 'Asking price must be positive and within market limits.',
    example: 10000,
    minimum: 1,
    maximum: 1000000000,
  })
  @IsInt({ message: 'Price must be an integer' })
  @Min(1, { message: 'Price must be at least 1' })
  @Max(1000000000, { message: 'Price cannot exceed 1 billion' })
  @IsPositive()
  askingPrice: number;
}
