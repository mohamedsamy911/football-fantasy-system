import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a user by ID.' })
  @ApiResponse({ status: 200, description: 'User returned successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the user to retrieve.',
    type: String,
  })
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
