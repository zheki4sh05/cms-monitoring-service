import { ApiProperty } from '@nestjs/swagger';

export class PutIntegrationConfigStatusResponseDto {
  @ApiProperty({ example: 'ic-1' })
  id!: string;

  @ApiProperty({ example: '2026-04-13T10:25:10.000Z' })
  savedAt!: string;
}
