import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  UseGuards,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateListingDto } from './dto/create-listing.dto';
import { BuyDto } from './dto/buy.dto';
import { ListTransfersQueryDto } from './dto/list-transfers-query.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/currentUser.decorator';
import {
  PaginatedTransferListingsResponseDto,
  BuyResponseDto,
  TransferListingResponseDto,
} from './dto/transfer-listing-response.dto';

@ApiTags('Transfers')
@Controller({ path: 'transfers', version: '1' })
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
    type: PaginatedTransferListingsResponseDto,
  })
  async list(@Query() query: ListTransfersQueryDto) {
    return await this.transfers.findAll(query);
  }

  // Create listing (must be authenticated)
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Create a new transfer listing for a player.' })
  @ApiResponse({
    status: 201,
    description: 'Listing successfully created.',
    type: TransferListingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiBody({
    type: CreateListingDto,
    description: 'Data required to list a player for sale.',
  })
  async create(@Body() dto: CreateListingDto, @CurrentUser() userId: string) {
    return await this.transfers.createListing(dto, userId);
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
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() userId: string,
  ) {
    return await this.transfers.removeListing(id, userId);
  }

  // Buy
  @UseGuards(JwtAuthGuard)
  @Post('buy')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Purchase a player from an active listing.' })
  @ApiResponse({
    status: 201,
    description: 'Player successfully purchased and transferred.',
    type: BuyResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Listing not found.' })
  @ApiBody({ type: BuyDto, description: 'Listing ID of the player to buy.' })
  async buy(@Body() dto: BuyDto, @CurrentUser() userId: string) {
    return await this.transfers.buy(dto.listingId, userId);
  }
}
