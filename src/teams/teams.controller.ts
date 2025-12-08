import { Controller, Get, Param } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get(':id/players')
  @ApiOperation({ summary: 'Retrieve players by team ID.' })
  @ApiResponse({ status: 200, description: 'Players returned successfully.' })
  @ApiResponse({ status: 404, description: 'Players not found.' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the team to retrieve players from.',
    type: String,
  })
  async getPlayers(@Param('id') id: string) {
    return this.teamsService.getPlayers(id);
  }
}
