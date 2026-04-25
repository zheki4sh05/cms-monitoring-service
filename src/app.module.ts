import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ACCESS_TOKEN_VALIDATOR } from './core/auth/ports/access-token-validator.port.js';
import { USER_PERMISSION_CHECKER } from './core/auth/ports/user-permission-checker.port.js';
import { INTEGRATION_CONFIG_REPOSITORY } from './core/integration/ports/integration-config-repository.port.js';
import type { IntegrationConfigRepository } from './core/integration/ports/integration-config-repository.port.js';
import { CreateIntegrationConfigUseCase } from './core/integration/use-cases/create-integration-config.use-case.js';
import { DeleteIntegrationConfigByIdUseCase } from './core/integration/use-cases/delete-integration-config-by-id.use-case.js';
import { GetIntegrationConfigByIdUseCase } from './core/integration/use-cases/get-integration-config-by-id.use-case.js';
import { GetIntegrationConfigChangeHistoryUseCase } from './core/integration/use-cases/get-integration-config-change-history.use-case.js';
import { GetIntegrationConfigsUseCase } from './core/integration/use-cases/get-integration-configs.use-case.js';
import { UpdateIntegrationConfigByIdUseCase } from './core/integration/use-cases/update-integration-config-by-id.use-case.js';
import { UpdateIntegrationConfigStatusUseCase } from './core/integration/use-cases/update-integration-config-status.use-case.js';
import { CreateRiskObjectUseCase } from './core/risk-object/use-cases/create-risk-object.use-case.js';
import { GetRiskObjectChangeHistoryByIdUseCase } from './core/risk-object/use-cases/get-risk-object-change-history-by-id.use-case.js';
import { GetRiskObjectChangeHistoryUseCase } from './core/risk-object/use-cases/get-risk-object-change-history.use-case.js';
import { GetRiskObjectByIdUseCase } from './core/risk-object/use-cases/get-risk-object-by-id.use-case.js';
import { GetRiskObjectModelsUseCase } from './core/risk-object/use-cases/get-risk-object-models.use-case.js';
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
import { IntegrationRuntimeProcessManagerService } from './infrastructure/background/integration-runtime-process-manager.service.js';
import { IntegrationInvocationEventBusService } from './infrastructure/background/integration-invocation-event-bus.service.js';
import { OutboxManagerService } from './infrastructure/background/outbox-manager.service.js';
import { OutboxProcessingService } from './infrastructure/background/outbox-processing.service.js';
import { OutboxQueueService } from './infrastructure/background/outbox-queue.service.js';
import { OutboxRetryManagerService } from './infrastructure/background/outbox-retry-manager.service.js';
import { PullIntegrationBackgroundProcessService } from './infrastructure/background/pull-integration-background-process.service.js';
import { CryptoUuidGenerator } from './infrastructure/identifiers/crypto-uuid.generator.js';
import { IntegrationStatusEventsPublisher } from './infrastructure/messaging/integration-status-events.publisher.js';
import { PostgresIntegrationConfigRepository } from './infrastructure/persistence/postgres-integration-config.repository.js';
import { PostgresMonitoringResultRepository } from './infrastructure/persistence/postgres-monitoring-result.repository.js';
import { PostgresMonitoringRetryRepository } from './infrastructure/persistence/postgres-monitoring-retry.repository.js';
import { PostgresRiskObjectRepository } from './infrastructure/persistence/postgres-risk-object.repository.js';
import { JwtAccessTokenValidator } from './infrastructure/security/jwt-access-token.validator.js';
import { CmsAuthUserPermissionCheckerService } from './infrastructure/security/cms-auth-user-permission-checker.service.js';
import { AuthenticationGuard } from './web/auth/authentication.guard.js';
import { IntegrationConfigController } from './web/integration/integration-config.controller.js';
import { RiskObjectController } from './web/risk-object/risk-object.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // чтобы ConfigService был доступен везде
    }),
  ],
  controllers: [RiskObjectController, IntegrationConfigController],
  providers: [
    PostgresMigratorService,
    postgresPoolProvider,
    PostgresPoolLifecycle,
    IntegrationRuntimeProcessManagerService,
    IntegrationInvocationEventBusService,
    PullIntegrationBackgroundProcessService,
    OutboxQueueService,
    OutboxManagerService,
    OutboxRetryManagerService,
    OutboxProcessingService,
    IntegrationStatusEventsPublisher,
    CryptoUuidGenerator,
    PostgresIntegrationConfigRepository,
    PostgresMonitoringResultRepository,
    PostgresMonitoringRetryRepository,
    PostgresRiskObjectRepository,
    JwtAccessTokenValidator,
    CmsAuthUserPermissionCheckerService,
    {
      provide: RISK_OBJECT_REPOSITORY,
      useExisting: PostgresRiskObjectRepository,
    },
    {
      provide: ACCESS_TOKEN_VALIDATOR,
      useExisting: JwtAccessTokenValidator,
    },
    {
      provide: USER_PERMISSION_CHECKER,
      useExisting: CmsAuthUserPermissionCheckerService,
    },
    {
      provide: INTEGRATION_CONFIG_REPOSITORY,
      useExisting: PostgresIntegrationConfigRepository,
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
      provide: CreateIntegrationConfigUseCase,
      inject: [INTEGRATION_CONFIG_REPOSITORY],
      useFactory: (integrationConfigRepository: IntegrationConfigRepository) =>
        new CreateIntegrationConfigUseCase(integrationConfigRepository),
    },
    {
      provide: DeleteIntegrationConfigByIdUseCase,
      inject: [INTEGRATION_CONFIG_REPOSITORY],
      useFactory: (integrationConfigRepository: IntegrationConfigRepository) =>
        new DeleteIntegrationConfigByIdUseCase(integrationConfigRepository),
    },
    {
      provide: GetIntegrationConfigsUseCase,
      inject: [INTEGRATION_CONFIG_REPOSITORY],
      useFactory: (integrationConfigRepository: IntegrationConfigRepository) =>
        new GetIntegrationConfigsUseCase(integrationConfigRepository),
    },
    {
      provide: GetIntegrationConfigChangeHistoryUseCase,
      inject: [INTEGRATION_CONFIG_REPOSITORY],
      useFactory: (integrationConfigRepository: IntegrationConfigRepository) =>
        new GetIntegrationConfigChangeHistoryUseCase(integrationConfigRepository),
    },
    {
      provide: GetIntegrationConfigByIdUseCase,
      inject: [INTEGRATION_CONFIG_REPOSITORY],
      useFactory: (integrationConfigRepository: IntegrationConfigRepository) =>
        new GetIntegrationConfigByIdUseCase(integrationConfigRepository),
    },
    {
      provide: UpdateIntegrationConfigByIdUseCase,
      inject: [INTEGRATION_CONFIG_REPOSITORY],
      useFactory: (integrationConfigRepository: IntegrationConfigRepository) =>
        new UpdateIntegrationConfigByIdUseCase(integrationConfigRepository),
    },
    {
      provide: UpdateIntegrationConfigStatusUseCase,
      inject: [INTEGRATION_CONFIG_REPOSITORY],
      useFactory: (integrationConfigRepository: IntegrationConfigRepository) =>
        new UpdateIntegrationConfigStatusUseCase(integrationConfigRepository),
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
      provide: GetRiskObjectModelsUseCase,
      inject: [RISK_OBJECT_REPOSITORY],
      useFactory: (riskObjectRepository: RiskObjectRepository) =>
        new GetRiskObjectModelsUseCase(riskObjectRepository),
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