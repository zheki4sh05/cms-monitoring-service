import { ApiProperty } from '@nestjs/swagger';

export class IntegrationConfigListItemDto {
  @ApiProperty({ example: 'ic-1' })
  id!: string;

  @ApiProperty({ example: 1 })
  number!: number;

  @ApiProperty({ example: 'OAuth2: корпоративный SSO' })
  name!: string;

  @ApiProperty({ example: '2026-04-12T08:20:00.000Z' })
  updatedAt!: string;

  @ApiProperty({ enum: ['active', 'inactive'], example: 'active' })
  status!: 'active' | 'inactive';

  @ApiProperty({ example: 'Мария Петрова' })
  authorName!: string;
}

export class GetIntegrationConfigsResponseDto {
  @ApiProperty({ type: () => [IntegrationConfigListItemDto] })
  items!: IntegrationConfigListItemDto[];

  @ApiProperty({ example: true })
  hasMore!: boolean;
}
