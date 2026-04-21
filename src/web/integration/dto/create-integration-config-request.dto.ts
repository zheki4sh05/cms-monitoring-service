import { ApiProperty } from '@nestjs/swagger';

class MappingRuleDto {
  @ApiProperty({ example: 'Ref_Key' })
  from!: string;

  @ApiProperty({ example: 'external_id' })
  to!: string;

  @ApiProperty({ example: 'date_to_iso', required: false })
  transform?: string;
}

class PullConfigQueryParamDto {
  @ApiProperty({ example: 'q' })
  key!: string;

  @ApiProperty({ example: 'name' })
  value!: string;
}

class PullConfigDto {
  @ApiProperty({ example: 'minutes' })
  pollingPreset!: string;

  @ApiProperty({ example: 5 })
  pollingMinutes!: number;

  @ApiProperty({ example: 'basic' })
  authType!: string;

  @ApiProperty({ example: 'login', required: false })
  authBasicLogin?: string;

  @ApiProperty({ example: 'password', required: false })
  authBasicPassword?: string;

  @ApiProperty({ example: '/api/v1/entities' })
  requestUri!: string;

  @ApiProperty({
    type: () => [PullConfigQueryParamDto],
    example: [{ key: 'q', value: 'name' }],
  })
  requestQueryParams!: PullConfigQueryParamDto[];

  @ApiProperty({ example: true })
  pagedPollingEnabled!: boolean;

  @ApiProperty({ example: 8, required: false })
  pageSize?: number;

  @ApiProperty({ example: false })
  sinceStartDateEnabled!: boolean;
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

  @ApiProperty({
    type: () => PullConfigDto,
    required: false,
    example: {
      pollingPreset: 'minutes',
      pollingMinutes: 5,
      authType: 'basic',
      authBasicLogin: 'login',
      authBasicPassword: 'password',
      requestUri: '/api/v1/entities',
      requestQueryParams: [{ key: 'q', value: 'name' }],
      pagedPollingEnabled: true,
      pageSize: 8,
      sinceStartDateEnabled: false,
    },
  })
  pullConfig?: PullConfigDto;
}
