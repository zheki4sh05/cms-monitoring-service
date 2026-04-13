import { ApiProperty } from '@nestjs/swagger';

export class RiskObjectModelBriefDto {
  @ApiProperty({ example: 'ro-1' })
  id!: string;

  @ApiProperty({ example: 'ООО «Вектор»' })
  name!: string;
}

export class GetRiskObjectModelsResponseDto {
  @ApiProperty({ type: () => [RiskObjectModelBriefDto] })
  items!: RiskObjectModelBriefDto[];
}
