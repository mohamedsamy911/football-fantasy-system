import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class IdentifyDto {
  @ApiProperty({
    description: 'Email address of the user.',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password of the user.',
    example: 'password',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
