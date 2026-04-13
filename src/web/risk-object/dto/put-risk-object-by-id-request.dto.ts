import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PutRiskObjectByIdRequestDto {
  @ApiProperty({ example: 'Название объекта' })
  name!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: {
      external_id: null,
      attributes: [{ key: null, value: null }],
    },
  })
  definition!: Record<string, unknown>;

  @ApiPropertyOptional({ enum: ['active', 'archived'], example: 'active' })
  status?: 'active' | 'archived';
}
