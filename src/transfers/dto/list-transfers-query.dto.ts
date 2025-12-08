import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PAGINATION_CONSTRAINTS } from '../../config/constants';

/**
 * Query parameters DTO for listing transfers with validation.
 */
export class ListTransfersQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by player name (partial match, case-insensitive)',
    example: 'Messi',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Player name cannot exceed 100 characters' })
  playerName?: string;

  @ApiPropertyOptional({
    description: 'Filter by team ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID(4, { message: 'Team ID must be a valid UUID v4' })
  teamId?: string;

  @ApiPropertyOptional({
    description: 'Minimum asking price filter',
    example: 1000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'minPrice must be an integer' })
  @Min(0, { message: 'minPrice cannot be negative' })
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum asking price filter',
    example: 1000000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'maxPrice must be an integer' })
  @Min(0, { message: 'maxPrice cannot be negative' })
  maxPrice?: number;

  @ApiPropertyOptional({
    description: `Number of results to return (default: ${PAGINATION_CONSTRAINTS.DEFAULT_LIMIT}, max: ${PAGINATION_CONSTRAINTS.MAX_LIMIT})`,
    example: 20,
    minimum: PAGINATION_CONSTRAINTS.MIN_LIMIT,
    maximum: PAGINATION_CONSTRAINTS.MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(PAGINATION_CONSTRAINTS.MIN_LIMIT, {
    message: `limit must be at least ${PAGINATION_CONSTRAINTS.MIN_LIMIT}`,
  })
  @Max(PAGINATION_CONSTRAINTS.MAX_LIMIT, {
    message: `limit cannot exceed ${PAGINATION_CONSTRAINTS.MAX_LIMIT}`,
  })
  limit?: number;

  @ApiPropertyOptional({
    description: 'Number of results to skip (for pagination)',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset must be an integer' })
  @Min(0, { message: 'offset cannot be negative' })
  offset?: number;
}
