import { ApiProperty } from '@nestjs/swagger';

export class RiskObjectModelBriefDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'UUID рискового объекта' })
  uuid!: string;

  @ApiProperty({ example: 'ООО «Вектор»' })
  name!: string;
}

export class GetRiskObjectModelsResponseDto {
  @ApiProperty({ type: () => [RiskObjectModelBriefDto] })
  items!: RiskObjectModelBriefDto[];
}
