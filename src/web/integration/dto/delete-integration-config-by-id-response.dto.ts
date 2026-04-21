import { ApiProperty } from '@nestjs/swagger';

export class DeleteIntegrationConfigByIdResponseDto {
  @ApiProperty({ example: 'ic-1' })
  id!: string;

  @ApiProperty({ example: '2026-04-21T20:41:00.000Z' })
  deletedAt!: string;
}
