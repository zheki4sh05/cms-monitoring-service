import { ApiProperty } from '@nestjs/swagger';

export class PutRiskObjectByIdResponseDto {
  @ApiProperty({ example: 'ro-1' })
  id!: string;

  @ApiProperty({ example: '2026-04-13T10:10:10.000Z' })
  savedAt!: string;
}
