import { ApiProperty } from '@nestjs/swagger';

export class RiskObjectChangeHistoryItemDto {
  @ApiProperty({ example: 42 })
  id!: number;

  @ApiProperty({ example: 'ro-1' })
  riskObjectId!: string;

  @ApiProperty({ example: 'ООО «Вектор»' })
  name!: string;

  @ApiProperty({ example: 'Обновил ключи и статус' })
  changeComment!: string;

  @ApiProperty({ enum: ['active', 'archived'], example: 'active' })
  status!: 'active' | 'archived';

  @ApiProperty({ example: '2026-04-13T10:10:10.000Z' })
  changedAt!: string;
}

export class GetRiskObjectChangeHistoryResponseDto {
  @ApiProperty({ type: () => [RiskObjectChangeHistoryItemDto] })
  items!: RiskObjectChangeHistoryItemDto[];

  @ApiProperty({ example: true })
  hasMore!: boolean;
}
