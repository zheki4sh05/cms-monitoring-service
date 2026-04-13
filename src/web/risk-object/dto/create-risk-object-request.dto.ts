import { ApiProperty } from '@nestjs/swagger';

class RiskObjectAttributeDto {
  @ApiProperty({
    type: 'string',
    nullable: true,
    example: null,
  })
  key!: string | null;

  @ApiProperty({
    type: 'string',
    nullable: true,
    example: null,
  })
  value!: string | null;
}

class RiskObjectDefinitionDto {
  @ApiProperty({
    type: 'string',
    nullable: true,
    example: null,
  })
  external_id!: string | null;

  @ApiProperty({
    type: () => [RiskObjectAttributeDto],
    example: [{ key: null, value: null }],
  })
  attributes!: RiskObjectAttributeDto[];
}

export class CreateRiskObjectRequestDto {
  @ApiProperty({
    example: 'Название объекта',
  })
  name!: string;

  @ApiProperty({
    type: () => RiskObjectDefinitionDto,
  })
  definition!: RiskObjectDefinitionDto;
}
