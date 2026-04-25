import { ApiProperty } from '@nestjs/swagger';

class MappingRuleDto {
  @ApiProperty({ example: 'sub' })
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

  @ApiProperty({
    type: () => PullConfigDto,
    required: false,
    nullable: true,
  })
  pullConfig?: PullConfigDto | null;

  @ApiProperty({ example: true })
  active!: boolean;

  @ApiProperty({ enum: ['idle', 'loading', 'work', 'failed', 'stop'], example: 'work' })
  status!: 'idle' | 'loading' | 'work' | 'failed' | 'stop';

  @ApiProperty({ example: 10 })
  invocations_success!: number;

  @ApiProperty({ example: 2 })
  invocations_failed!: number;

  @ApiProperty({ type: () => [String], example: ['timeout on partner API'] })
  failed_comment!: string[];

  @ApiProperty({ example: 'Мария Петрова' })
  authorName!: string;

  @ApiProperty({ example: '2026-04-12T08:20:00.000Z' })
  updatedAt!: string;
}
