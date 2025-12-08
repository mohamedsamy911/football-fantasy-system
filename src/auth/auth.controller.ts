import { Body, Controller, Post } from '@nestjs/common';
import { IdentifyDto } from './dto/identify.dto';
import { AuthService } from './auth.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register or login a user.' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered or logged in.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiBody({ type: IdentifyDto, description: 'User credentials.' })
  @Post('identify')
  async identify(@Body() dto: IdentifyDto) {
    return this.authService.identify(dto);
  }
}
