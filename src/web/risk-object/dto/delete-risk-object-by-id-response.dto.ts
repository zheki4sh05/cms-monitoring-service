import { ApiProperty } from '@nestjs/swagger';

export class DeleteRiskObjectByIdResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: '2026-05-13T12:00:00.000Z' })
  deletedAt!: string;
}
