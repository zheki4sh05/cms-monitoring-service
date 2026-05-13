import { ApiProperty } from '@nestjs/swagger';

class IntegrationRiskObjectModelDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'Модель AML', description: 'Имя из основной таблицы или последнего снимка в истории' })
  name!: string;

  @ApiProperty({
    example: false,
    description: 'true, если рисковый объект удалён из основной таблицы (данные имени могут быть из истории)',
  })
  isDeleted!: boolean;
}

export class IntegrationConfigListItemDto {
  @ApiProperty({ example: 'ic-1' })
  id!: string;

  @ApiProperty({ example: 1 })
  number!: number;

  @ApiProperty({ example: 'OAuth2: корпоративный SSO' })
  name!: string;

  @ApiProperty({ example: '2026-04-12T08:20:00.000Z' })
  updatedAt!: string;

  @ApiProperty({ example: false })
  active!: boolean;

  @ApiProperty({ enum: ['idle', 'loading', 'work', 'failed', 'stop'], example: 'work' })
  status!: 'idle' | 'loading' | 'work' | 'failed' | 'stop';

  @ApiProperty({ enum: ['good', 'warning', 'error'], example: 'good' })
  healt!: 'good' | 'warning' | 'error';

  @ApiProperty({ example: 'Мария Петрова' })
  authorName!: string;

  @ApiProperty({ type: () => IntegrationRiskObjectModelDto })
  riskObjectModel!: IntegrationRiskObjectModelDto;
}

export class GetIntegrationConfigsResponseDto {
  @ApiProperty({ type: () => [IntegrationConfigListItemDto] })
  items!: IntegrationConfigListItemDto[];

  @ApiProperty({ example: true })
  hasMore!: boolean;
}
