import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * Nested player info in transfer listing response.
 */
export class PlayerResponseDto {
  @ApiProperty({
    description: 'Player UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Player name', example: 'Leo Messi' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Player position', example: 'ATT' })
  @Expose()
  position: string;

  @ApiPropertyOptional({ description: 'Team ID the player belongs to' })
  @Expose()
  teamId?: string;
}

/**
 * Response DTO for a single transfer listing.
 */
export class TransferListingResponseDto {
  @ApiProperty({
    description: 'Listing UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Asking price in currency units',
    example: 50000,
  })
  @Expose()
  askingPrice: number;

  @ApiProperty({ description: 'When the listing was created' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Player details', type: PlayerResponseDto })
  @Expose()
  @Type(() => PlayerResponseDto)
  player: PlayerResponseDto;
}

/**
 * Pagination metadata for paginated responses.
 */
export class PaginationMetaDto {
  @ApiProperty({ description: 'Number of items per page', example: 50 })
  @Expose()
  limit: number;

  @ApiProperty({ description: 'Number of items skipped', example: 0 })
  @Expose()
  offset: number;

  @ApiProperty({
    description: 'Total number of items matching the query',
    example: 150,
  })
  @Expose()
  total: number;

  @ApiProperty({
    description: 'Whether there are more items after this page',
    example: true,
  })
  @Expose()
  hasMore: boolean;
}

/**
 * Paginated response for transfer listings.
 */
export class PaginatedTransferListingsResponseDto {
  @ApiProperty({
    description: 'List of transfer listings',
    type: [TransferListingResponseDto],
  })
  @Expose()
  @Type(() => TransferListingResponseDto)
  data: TransferListingResponseDto[];

  @ApiProperty({ description: 'Pagination metadata', type: PaginationMetaDto })
  @Expose()
  @Type(() => PaginationMetaDto)
  pagination: PaginationMetaDto;
}

/**
 * Response DTO for successful buy operation.
 */
export class BuyResponseDto {
  @ApiProperty({ description: 'Operation success status', example: true })
  @Expose()
  success: boolean;

  @ApiProperty({ description: 'Final price paid (after fees)', example: 47500 })
  @Expose()
  finalPrice: number;

  @ApiProperty({ description: 'ID of the purchased player' })
  @Expose()
  playerId: string;

  @ApiProperty({ description: 'ID of the buyer team' })
  @Expose()
  buyerTeamId: string;

  @ApiProperty({ description: 'ID of the seller team' })
  @Expose()
  sellerTeamId: string;
}

/**
 * Response DTO for create/remove listing operations.
 */
export class ListingOperationResponseDto {
  @ApiProperty({ description: 'Operation success status', example: true })
  @Expose()
  success: boolean;

  @ApiPropertyOptional({ description: 'Listing ID (for create operations)' })
  @Expose()
  id?: string;
}
