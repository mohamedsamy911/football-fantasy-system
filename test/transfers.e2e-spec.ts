import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TeamsService } from '../src/teams/teams.service';
import { PlayersModule } from '../src/players/players.module';
import { Player } from '../src/players/entities/player.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('Transfers (e2e)', () => {
  let app: INestApplication;
  let teamsService: TeamsService;
  let playersRepo: Repository<Player>;

  let buyerToken: string;
  let sellerToken: string;
  let buyerUserId: string;
  let sellerUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, PlayersModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();

    teamsService = moduleFixture.get(TeamsService);
    playersRepo = moduleFixture.get(getRepositoryToken(Player));

    const server = app.getHttpServer() as unknown as import('http').Server;

    const sellerRes = await request(server)
      .post('/v1/auth/identify')
      .send({ email: 'seller@example.com', password: 'password123' })
      .expect(201);
    const sellerBody = sellerRes.body as { token: string };
    sellerToken = sellerBody.token;
    const sellerPayload = JSON.parse(
      Buffer.from(sellerToken.split('.')[1], 'base64').toString(),
    ) as { sub: string };
    sellerUserId = sellerPayload.sub;

    const buyerRes = await request(server)
      .post('/v1/auth/identify')
      .send({ email: 'buyer@example.com', password: 'password123' })
      .expect(201);
    const buyerBody = buyerRes.body as { token: string };
    buyerToken = buyerBody.token;
    const buyerPayload = JSON.parse(
      Buffer.from(buyerToken.split('.')[1], 'base64').toString(),
    ) as { sub: string };
    buyerUserId = buyerPayload.sub;

    const sellerTeam = await teamsService.createTeamForUser(sellerUserId);
    await teamsService.generatePlayers(sellerTeam.id);
    const buyerTeam = await teamsService.createTeamForUser(buyerUserId);
    await teamsService.generatePlayers(buyerTeam.id);
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists transfers, creates a listing and buys it', async () => {
    const server = app.getHttpServer() as unknown as import('http').Server;

    // Pick a player from seller's team
    const sellerPlayers = await playersRepo.find({
      where: { team: { user: { id: sellerUserId } } },
      relations: ['team'],
      take: 1,
    });
    expect(sellerPlayers.length).toBe(1);
    const player = sellerPlayers[0];

    // Create listing
    const createRes = await request(server)
      .post('/v1/transfers')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ playerId: player.id, askingPrice: 10000 })
      .expect(201);
    const createdBody = createRes.body as { id: string };
    const listingId: string = createdBody.id;
    expect(typeof listingId).toBe('string');

    // List transfers (should include the newly created listing)
    const listRes = await request(server)
      .get('/v1/transfers')
      .query({ limit: 10 })
      .expect(200);
    const listBody = listRes.body as { data: unknown[] };
    expect(Array.isArray(listBody.data)).toBe(true);

    // Buy listing
    const buyRes = await request(server)
      .post('/v1/transfers/buy')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ listingId })
      .expect(201);
    const buyBody = buyRes.body as { success: boolean; finalPrice: number };
    expect(buyBody.success).toBe(true);
    expect(typeof buyBody.finalPrice).toBe('number');
  });
});
