import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { Player } from '../players/entities/player.entity';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { BullModule } from '@nestjs/bull';
import { TeamCreationProcessor } from './jobs/team-creation.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, Player]),

    ...(process.env.NODE_ENV === 'test'
      ? []
      : [
          BullModule.registerQueue({
            name: 'team-creation',
          }),
        ]),
  ],
  providers: [
    TeamsService,
    ...(process.env.NODE_ENV === 'test' ? [] : [TeamCreationProcessor]),
  ],
  controllers: [TeamsController],
  exports: [TeamsService],
})
export class TeamsModule {}
