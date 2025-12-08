import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    @InjectQueue('team-creation')
    private readonly teamCreationQueue: Queue,
  ) {}

  /**
   * Retrieves a user entity by their email address, including their associated team.
   * @param email The unique email of the user to find.
   * @returns A Promise that resolves to the User entity or null if not found.
   */
  findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { email },
      relations: ['team'],
    });
  }

  /**
   * Creates a new user in the database.
   * Note: Does not handle password hashing or unique constraint checks; this is handled in the auth module.
   * @param dto The data transfer object containing the user creation details.
   * @returns A Promise that resolves to the newly created and saved User entity.
   */
  async create(dto: CreateUserDto): Promise<User> {
    const user = this.usersRepo.create(dto);
    return this.usersRepo.save(user);
  }

  /**
   * Adds a job to the 'team-creation' BullMQ queue to asynchronously create a user's fantasy team.
   * @param userId The ID of the newly created user for whom the team will be created.
   * @returns A Promise that resolves to the BullMQ Job object.
   */
  async enqueueTeamCreation(userId: string) {
    return this.teamCreationQueue.add('create-team', { userId });
  }

  /**
   * Retrieves a user entity by their ID, including their associated team.
   * @param id The unique ID (UUID or similar) of the user to find.
   * @returns A Promise that resolves to the User entity or null if not found.
   */
  async findById(id: string) {
    return this.usersRepo.findOne({ where: { id }, relations: ['team'] });
  }
}
