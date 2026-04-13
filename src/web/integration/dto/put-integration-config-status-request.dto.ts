import { ApiProperty } from '@nestjs/swagger';

export class PutIntegrationConfigStatusRequestDto {
  @ApiProperty({ enum: ['active', 'inactive'], example: 'inactive' })
  status!: 'active' | 'inactive';
}
