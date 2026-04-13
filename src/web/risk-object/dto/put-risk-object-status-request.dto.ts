import { ApiProperty } from '@nestjs/swagger';

export class PutRiskObjectStatusRequestDto {
  @ApiProperty({ enum: ['active', 'archived'], example: 'active' })
  status!: 'active' | 'archived';
}
