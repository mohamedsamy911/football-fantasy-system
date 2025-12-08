import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { PlayersModule } from './players/players.module';
import { TransfersModule } from './transfers/transfers.module';
import { getRedisConfig } from './config/cache.config';

@Module({
  imports: [
    // -------------------------------
    // Environment Variables
    // -------------------------------
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // -------------------------------
    // Database (PostgreSQL)
    // -------------------------------
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'football_manager',
      autoLoadEntities: true, // auto-detect entities
      synchronize: process.env.NODE_ENV !== 'production', // DISABLED in production - use migrations
      logging: false,
    }),

    // -------------------------------
    // BullMQ (Redis)
    // -------------------------------
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),

    // -------------------------------
    // Cache (Redis)
    // -------------------------------
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => getRedisConfig(),
    }),

    // -------------------------------
    // Application Modules
    // -------------------------------
    AuthModule,
    UsersModule,
    TeamsModule,
    PlayersModule,
    TransfersModule,
  ],
})
export class AppModule {}
