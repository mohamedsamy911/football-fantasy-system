import { Controller, Get, Param, Patch, Body, Delete } from '@nestjs/common';
import { PlayersService } from './players.service';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Players')
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a player by ID.' })
  @ApiResponse({ status: 200, description: 'Player returned successfully.' })
  @ApiResponse({ status: 404, description: 'Player not found.' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the player to retrieve.',
    type: String,
  })
  async getPlayer(@Param('id') id: string) {
    return this.playersService.findById(id);
  }

  @Get('team/:teamId')
  @ApiOperation({ summary: 'Retrieve players by team ID.' })
  @ApiResponse({ status: 200, description: 'Players returned successfully.' })
  @ApiResponse({ status: 404, description: 'Players not found.' })
  @ApiParam({
    name: 'teamId',
    description: 'The ID of the team to retrieve players from.',
    type: String,
  })
  async getByTeam(@Param('teamId') teamId: string) {
    return this.playersService.findByTeam(teamId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a player by ID.' })
  @ApiResponse({ status: 200, description: 'Player updated successfully.' })
  @ApiResponse({ status: 404, description: 'Player not found.' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the player to update.',
    type: String,
  })
  async update(@Param('id') id: string, @Body() dto: UpdatePlayerDto) {
    return this.playersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a player by ID.' })
  @ApiResponse({ status: 200, description: 'Player deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Player not found.' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the player to delete.',
    type: String,
  })
  async delete(@Param('id') id: string) {
    return this.playersService.delete(id);
  }
}
