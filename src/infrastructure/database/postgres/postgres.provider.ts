import { ConfigService } from '@nestjs/config';
import { Pool, type PoolConfig } from 'pg';
import { PG_POOL } from './postgres.tokens.js';
import type { Provider } from '@nestjs/common';

const buildPoolConfig = (configService: ConfigService): PoolConfig => {
  const connectionString = configService.get<string>('DATABASE_URL');

  if (connectionString) {
    return { connectionString };
  }

  return {
    host: configService.get<string>('POSTGRES_HOST', 'localhost'),
    port: Number(configService.get<string>('POSTGRES_PORT', '5432')),
    user: configService.get<string>('POSTGRES_USER'),
    password: configService.get<string>('POSTGRES_PASSWORD'),
    database: configService.get<string>('POSTGRES_DB'),
  };
};

export const postgresPoolProvider: Provider = {
  provide: PG_POOL,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<Pool> => {
    return new Pool(buildPoolConfig(configService));
  },
};
