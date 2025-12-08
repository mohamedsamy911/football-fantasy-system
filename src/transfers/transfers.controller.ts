import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateListingDto } from './dto/create-listing.dto';
import { BuyDto } from './dto/buy.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiSecurity,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Transfers')
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfers: TransfersService) {}

  // List with optional filters
  @Get()
  @ApiOperation({
    summary: 'Retrieve a list of active player listings with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'List of listings returned successfully.',
  })

  @ApiQuery({
    name: 'playerName',
    required: false,
    type: String,
    description: 'Filter by player name (partial match).',
  })
  @ApiQuery({
    name: 'teamId',
    required: false,
    type: String,
    description: 'Filter by team ID.',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description: 'Minimum price filter.',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Maximum price filter.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of results to return (default: 50).',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of results to skip (default: 0).',
  })
  async list(
    @Query('playerName') playerName?: string,
    @Query('teamId') teamId?: string,
    @Query('minPrice', new ParseIntPipe({ optional: true }))
    minPrice?: number,
    @Query('maxPrice', new ParseIntPipe({ optional: true }))
    maxPrice?: number,
    @Query('limit', new ParseIntPipe({ optional: true }))
    limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true }))
    offset?: number,
  ) {
    return this.transfers.findAll({
      playerName,
      teamId,
      minPrice,
      maxPrice,
      limit,
      offset,
    });
  }

  // Create listing (must be authenticated)
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Create a new transfer listing for a player.' })
  @ApiResponse({ status: 201, description: 'Listing successfully created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiBody({
    type: CreateListingDto,
    description: 'Data required to list a player for sale.',
  })
  async create(@Body() dto: CreateListingDto, @Request() req) {
    const userId = req.user?.userId || req.user?.sub;
    return this.transfers.createListing(dto, userId);
  }

  // Remove listing (owner only)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiSecurity('JWT-auth')
  @ApiOperation({
    summary: 'Remove an existing transfer listing (must be the owner).',
  })
  @ApiResponse({ status: 200, description: 'Listing successfully removed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Not the owner).' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the listing to remove.',
    type: String,
  })
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user?.userId || req.user?.sub;
    return this.transfers.removeListing(id, userId);
  }

  // Buy
  @UseGuards(JwtAuthGuard)
  @Post('buy')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Purchase a player from an active listing.' })
  @ApiResponse({
    status: 201,
    description: 'Player successfully purchased and transferred.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Listing not found.' })
  @ApiBody({ type: BuyDto, description: 'Listing ID of the player to buy.' })
  async buy(@Body() dto: BuyDto, @Request() req) {
    const userId = req.user?.userId || req.user?.sub;
    return this.transfers.buy(dto.listingId, userId);
  }
}
