import { ApiProperty } from '@nestjs/swagger';

export class IntegrationConfigChangeHistoryItemDto {
  @ApiProperty({ example: 'hist-12' })
  id!: string;

  @ApiProperty({ example: 'ic-1' })
  integrationId!: string;

  @ApiProperty({ example: '2026-04-12T13:45:00.000Z' })
  changedAt!: string;

  @ApiProperty({ example: 'OAuth2: корпоративный SSO' })
  configName!: string;

  @ApiProperty({ example: 'Обновлены параметры подключения (#12)' })
  description!: string;

  @ApiProperty({ example: 'Мария Петрова' })
  authorName!: string;
}

export class GetIntegrationConfigChangeHistoryResponseDto {
  @ApiProperty({ type: () => [IntegrationConfigChangeHistoryItemDto] })
  items!: IntegrationConfigChangeHistoryItemDto[];

  @ApiProperty({ example: true })
  hasMore!: boolean;
}
