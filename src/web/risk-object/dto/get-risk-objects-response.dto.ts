import { ApiProperty } from '@nestjs/swagger';

export class RiskObjectListItemDto {
  @ApiProperty({ example: 'ro-1' })
  id!: string;

  @ApiProperty({ example: 'RO-001' })
  code!: string;

  @ApiProperty({ example: 'ООО «Вектор»' })
  name!: string;

  @ApiProperty({ enum: ['active', 'archived'], example: 'active' })
  status!: 'active' | 'archived';

  @ApiProperty({ example: '2026-04-12T10:15:00.000Z' })
  updatedAt!: string;
}

export class GetRiskObjectsResponseDto {
  @ApiProperty({ type: () => [RiskObjectListItemDto] })
  items!: RiskObjectListItemDto[];

  @ApiProperty({ example: true })
  hasMore!: boolean;
}
