import { ApiProperty } from '@nestjs/swagger';

export class CreateRiskObjectResponseDto {
  @ApiProperty({
    example: 'ro-1710000000000',
  })
  id!: string;

  @ApiProperty({
    example: '2026-04-13T10:10:10.000Z',
  })
  savedAt!: string;
}
