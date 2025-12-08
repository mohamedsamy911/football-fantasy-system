import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { IdentifyDto } from './dto/identify.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

/**
 * Authentication service.
 * @extends Injectable
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Identifies a user by their email and password.
   * @param dto The identify data transfer object containing the user's email and password.
   * @returns An object containing a message and a JWT token if successful, otherwise throws an exception.
   */
  async identify(dto: IdentifyDto) {
    const user = await this.usersService.findByEmail(dto.email);

    // if user not found, create a new one
    if (!user) {
      const hashed = await bcrypt.hash(dto.password, 10);
      const newUser = await this.usersService.create({
        email: dto.email,
        password: hashed,
      });

      // Emit team creation job
      await this.usersService.enqueueTeamCreation(newUser.id);

      return {
        message: 'User registered successfully. Team creation in progress.',
        token: this.jwt.sign({ sub: newUser.id }),
      };
    }

    // if user found, check password
    const validPass = await bcrypt.compare(dto.password, user.password);
    if (!validPass) throw new UnauthorizedException('Invalid credentials');

    return {
      message: 'Logged in successfully',
      token: this.jwt.sign({ sub: user.id }),
    };
  }
}
