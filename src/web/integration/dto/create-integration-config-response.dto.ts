import { ApiProperty } from '@nestjs/swagger';

export class CreateIntegrationConfigResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '2026-04-13T10:10:10.000Z' })
  savedAt!: string;
}
