import { ApiProperty } from '@nestjs/swagger';

class MappingRuleDto {
  @ApiProperty({ example: 'sub' })
  from!: string;

  @ApiProperty({ example: 'external_id' })
  to!: string;

  @ApiProperty({ example: 'date_to_iso', required: false })
  transform?: string;
}

export class GetIntegrationConfigByIdResponseDto {
  @ApiProperty({ example: 'ic-1' })
  id!: string;

  @ApiProperty({ example: 1 })
  number!: number;

  @ApiProperty({ example: 'OAuth2: корпоративный SSO' })
  name!: string;

  @ApiProperty({ enum: ['push', 'pull', 'broker'], example: 'push' })
  integrationKind!: 'push' | 'pull' | 'broker';

  @ApiProperty({ example: 'https://sso.example.local/api/sync' })
  endpointUrl!: string;

  @ApiProperty({ example: 'rom-1' })
  riskObjectModelId!: string;

  @ApiProperty({
    type: () => [MappingRuleDto],
    example: [{ from: 'sub', to: 'external_id' }],
  })
  mapping_rules!: MappingRuleDto[];

  @ApiProperty({ enum: ['active', 'inactive'], example: 'active' })
  status!: 'active' | 'inactive';

  @ApiProperty({ example: 'Мария Петрова' })
  authorName!: string;

  @ApiProperty({ example: '2026-04-12T08:20:00.000Z' })
  updatedAt!: string;
}
