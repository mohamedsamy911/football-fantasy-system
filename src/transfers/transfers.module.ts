import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { TransferListing } from './entities/transfer-listing.entity';
import { Player } from '../players/entities/player.entity';
import { Team } from '../teams/entities/team.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransferHistory } from './entities/transfer-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransferListing, Player, Team, TransferHistory]),
  ],
  providers: [TransfersService, JwtAuthGuard],
  controllers: [TransfersController],
})
export class TransfersModule {}
