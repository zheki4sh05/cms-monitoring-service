import { ApiProperty } from '@nestjs/swagger';

export class PutIntegrationConfigByIdResponseDto {
  @ApiProperty({ example: 'ic-1' })
  id!: string;

  @ApiProperty({ example: '2026-04-13T10:22:31.000Z' })
  savedAt!: string;
}
