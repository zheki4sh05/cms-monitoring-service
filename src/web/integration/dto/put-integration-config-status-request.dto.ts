import { ApiProperty } from '@nestjs/swagger';

export class PutIntegrationConfigStatusRequestDto {
  @ApiProperty({
    example: true,
    description: 'Целевой флаг активности интеграции. Поддерживаются поля status и active.',
  })
  status?: boolean;

  @ApiProperty({
    example: true,
    required: false,
    description: 'Устаревший алиас для status.',
  })
  active?: boolean;
}
