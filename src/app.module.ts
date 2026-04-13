import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ACCESS_TOKEN_VALIDATOR } from './core/auth/ports/access-token-validator.port.js';
import { CreateRiskObjectUseCase } from './core/risk-object/use-cases/create-risk-object.use-case.js';
import { GetRiskObjectChangeHistoryByIdUseCase } from './core/risk-object/use-cases/get-risk-object-change-history-by-id.use-case.js';
import { GetRiskObjectChangeHistoryUseCase } from './core/risk-object/use-cases/get-risk-object-change-history.use-case.js';
import { GetRiskObjectByIdUseCase } from './core/risk-object/use-cases/get-risk-object-by-id.use-case.js';
import { GetRiskObjectsUseCase } from './core/risk-object/use-cases/get-risk-objects.use-case.js';
import { UpdateRiskObjectByIdUseCase } from './core/risk-object/use-cases/update-risk-object-by-id.use-case.js';
import { UpdateRiskObjectStatusUseCase } from './core/risk-object/use-cases/update-risk-object-status.use-case.js';
import { RISK_OBJECT_REPOSITORY } from './core/risk-object/ports/risk-object-repository.port.js';
import type { RiskObjectRepository } from './core/risk-object/ports/risk-object-repository.port.js';
import { UUID_GENERATOR } from './core/shared/ports/uuid-generator.port.js';
import type { UuidGenerator } from './core/shared/ports/uuid-generator.port.js';
import { PostgresMigratorService } from './infrastructure/database/postgres/postgres-migrator.service.js';
import { postgresPoolProvider } from './infrastructure/database/postgres/postgres.provider.js';
import { PostgresPoolLifecycle } from './infrastructure/database/postgres/postgres-pool.lifecycle.js';
import { CryptoUuidGenerator } from './infrastructure/identifiers/crypto-uuid.generator.js';
import { PostgresRiskObjectRepository } from './infrastructure/persistence/postgres-risk-object.repository.js';
import { JwtAccessTokenValidator } from './infrastructure/security/jwt-access-token.validator.js';
import { AuthenticationGuard } from './web/auth/authentication.guard.js';
import { RiskObjectController } from './web/risk-object/risk-object.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // чтобы ConfigService был доступен везде
    }),
  ],
  controllers: [RiskObjectController],
  providers: [
    PostgresMigratorService,
    postgresPoolProvider,
    PostgresPoolLifecycle,
    CryptoUuidGenerator,
    PostgresRiskObjectRepository,
    JwtAccessTokenValidator,
    {
      provide: RISK_OBJECT_REPOSITORY,
      useExisting: PostgresRiskObjectRepository,
    },
    {
      provide: ACCESS_TOKEN_VALIDATOR,
      useExisting: JwtAccessTokenValidator,
    },
    {
      provide: UUID_GENERATOR,
      useExisting: CryptoUuidGenerator,
    },
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: CreateRiskObjectUseCase,
      inject: [RISK_OBJECT_REPOSITORY, UUID_GENERATOR],
      useFactory: (riskObjectRepository: RiskObjectRepository, uuidGenerator: UuidGenerator) =>
        new CreateRiskObjectUseCase(riskObjectRepository, uuidGenerator),
    },
    {
      provide: GetRiskObjectChangeHistoryUseCase,
      inject: [RISK_OBJECT_REPOSITORY],
      useFactory: (riskObjectRepository: RiskObjectRepository) =>
        new GetRiskObjectChangeHistoryUseCase(riskObjectRepository),
    },
    {
      provide: GetRiskObjectChangeHistoryByIdUseCase,
      inject: [RISK_OBJECT_REPOSITORY],
      useFactory: (riskObjectRepository: RiskObjectRepository) =>
        new GetRiskObjectChangeHistoryByIdUseCase(riskObjectRepository),
    },
    {
      provide: GetRiskObjectsUseCase,
      inject: [RISK_OBJECT_REPOSITORY],
      useFactory: (riskObjectRepository: RiskObjectRepository) =>
        new GetRiskObjectsUseCase(riskObjectRepository),
    },
    {
      provide: GetRiskObjectByIdUseCase,
      inject: [RISK_OBJECT_REPOSITORY],
      useFactory: (riskObjectRepository: RiskObjectRepository) =>
        new GetRiskObjectByIdUseCase(riskObjectRepository),
    },
    {
      provide: UpdateRiskObjectByIdUseCase,
      inject: [RISK_OBJECT_REPOSITORY],
      useFactory: (riskObjectRepository: RiskObjectRepository) =>
        new UpdateRiskObjectByIdUseCase(riskObjectRepository),
    },
    {
      provide: UpdateRiskObjectStatusUseCase,
      inject: [RISK_OBJECT_REPOSITORY],
      useFactory: (riskObjectRepository: RiskObjectRepository) =>
        new UpdateRiskObjectStatusUseCase(riskObjectRepository),
    },
  ],
})
export class AppModule {}