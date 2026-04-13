import { ApiProperty } from '@nestjs/swagger';

export class GetRiskObjectChangeHistoryByIdResponseDto {
  @ApiProperty({ example: 'roh-12' })
  id!: string;

  @ApiProperty({ example: 'ro-3' })
  riskObjectId!: string;

  @ApiProperty({ example: '2026-04-12T13:45:00.000Z' })
  changedAt!: string;

  @ApiProperty({ example: 'АО «Трастфлоу Логистик»' })
  riskObjectName!: string;

  @ApiProperty({ example: 'Проверка документов: одобрено (#12)' })
  description!: string;

  @ApiProperty({ example: 'Иван Сидоров' })
  authorName!: string;
}
