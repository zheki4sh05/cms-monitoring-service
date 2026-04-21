import { ApiProperty } from '@nestjs/swagger';

export class GetRiskObjectByIdResponseDto {
  @ApiProperty({ example: 'ro-1' })
  id!: string;

  @ApiProperty({ example: '66e521d0-3f76-43a1-847f-01a486f12345' })
  uuid!: string;

  @ApiProperty({ example: 'RO-001' })
  code!: string;

  @ApiProperty({ example: 'ООО «Вектор»' })
  name!: string;

  @ApiProperty({ enum: ['active', 'archived'], example: 'active' })
  status!: 'active' | 'archived';

  @ApiProperty({ example: '2026-04-12T10:15:00.000Z' })
  updatedAt!: string;

  @ApiProperty({
    example: '{"external_id":null,"attributes":[{"key":null,"value":null}]}',
  })
  definition!: string;
}
