import { ApiProperty } from '@nestjs/swagger';

class MappingRuleDto {
  @ApiProperty({ example: 'Ref_Key' })
  from!: string;

  @ApiProperty({ example: 'external_id' })
  to!: string;

  @ApiProperty({ example: 'date_to_iso', required: false })
  transform?: string;
}

export class CreateIntegrationConfigRequestDto {
  @ApiProperty({ example: 'OAuth2: корпоративный SSO' })
  name!: string;

  @ApiProperty({ enum: ['push', 'pull', 'broker'], example: 'push' })
  integrationKind!: string;

  @ApiProperty({ example: 'https://sso.example.local/api/sync' })
  endpointUrl!: string;

  @ApiProperty({ example: 'rom-1' })
  riskObjectModelId!: string;

  @ApiProperty({
    type: () => [MappingRuleDto],
    example: [
      { from: 'Ref_Key', to: 'external_id' },
      { from: 'Date', to: 'timestamp', transform: 'date_to_iso' },
    ],
  })
  mapping_rules!: MappingRuleDto[];
}
