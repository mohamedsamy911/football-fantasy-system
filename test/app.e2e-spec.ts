import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  it('/v1/auth/identify (POST) registers user and returns token', async () => {
    const server = app.getHttpServer() as unknown as import('http').Server;
    const res = await request(server)
      .post('/v1/auth/identify')
      .send({ email: 'e2e@example.com', password: 'password123' })
      .expect(201);
    const body = res.body as { token: string };
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(10);
  });
});
