import { ApiProperty } from '@nestjs/swagger';

export class PutIntegrationConfigStatusRequestDto {
  @ApiProperty({ example: true })
  active!: boolean;
}
