import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToOne,
  Index,
  OneToMany,
} from 'typeorm';
import { Team } from '../../teams/entities/team.entity';
import { PlayerPosition } from '../../common/enums/player-position.enum';
import { TransferListing } from '../../transfers/entities/transfer-listing.entity';
import { TransferHistory } from '../../transfers/entities/transfer-history.entity';

@Entity()
@Index(['team', 'position'])
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Team, (team) => team.players, { onDelete: 'CASCADE' })
  team: Team;

  @OneToMany(() => TransferHistory, (history) => history.player)
  transferHistory: TransferHistory[];

  @Column()
  name: string;

  @Column({ type: 'simple-enum', enum: PlayerPosition })
  position: PlayerPosition;

  @OneToOne(() => TransferListing, (listing) => listing.player)
  listing: TransferListing;

  @CreateDateColumn()
  createdAt: Date;
}
