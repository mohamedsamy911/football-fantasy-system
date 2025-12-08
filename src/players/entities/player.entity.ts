import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';
import { Team } from '../../teams/entities/team.entity';
import { PlayerPosition } from '../../common/enums/player-position.enum';
import { TransferListing } from '../../transfers/entities/transfer-listing.entity';

@Entity()
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Team, (team) => team.players, { onDelete: 'CASCADE' })
  team: Team;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: PlayerPosition })
  position: PlayerPosition;

  @OneToOne(() => TransferListing, (listing) => listing.player)
  listing: TransferListing;

  @CreateDateColumn()
  createdAt: Date;
}
