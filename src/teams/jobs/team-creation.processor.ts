import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bullmq';
import { TeamsService } from '../teams.service';

@Processor('team-creation')
export class TeamCreationProcessor {
  constructor(private readonly teamsService: TeamsService) {}

  @Process('create-team')
  async handleTeamCreation(job: Job<{ userId: string }>) {
    const { userId } = job.data;

    const team = await this.teamsService.createTeamForUser(userId);

    await this.teamsService.generatePlayers(team.id);

    return { status: 'team_created', teamId: team.id };
  }
}
