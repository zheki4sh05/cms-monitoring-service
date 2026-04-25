import {
  BadRequestException,
  Controller,
  Logger,
  NotFoundException,
  Param,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { TakeMonitoringResultByIdUseCase } from '../../core/monitoring-result/use-cases/take-monitoring-result-by-id.use-case.js';
import { DomainValidationError } from '../../core/shared/errors/domain-validation.error.js';
import { Public } from '../auth/public.decorator.js';
import { PutMonitoringResultTakeByIdResponseDto } from './dto/put-monitoring-result-take-by-id-response.dto.js';

@ApiTags('Monitoring Results')
@Controller()
export class MonitoringResultController {
  private readonly logger = new Logger(MonitoringResultController.name);

  constructor(private readonly takeMonitoringResultByIdUseCase: TakeMonitoringResultByIdUseCase) {}

  @Public()
  @ApiOperation({ summary: 'Взять запись мониторинга в обработку по id и удалить её из очереди' })
  @ApiParam({ name: 'id', required: true, example: 'dacd1e4a-216e-47fd-ad6f-a719f2f42863' })
  @ApiOkResponse({ type: PutMonitoringResultTakeByIdResponseDto })
  @ApiNotFoundResponse({ description: 'Запись monitoring_result не найдена' })
  @ApiBadRequestResponse({ description: 'Некорректный id (ожидается UUID)' })
  @Put('monitoring-results/:id/take')
  async takeMonitoringResultById(
    @Param('id') idParam: string | undefined,
  ): Promise<PutMonitoringResultTakeByIdResponseDto> {
    const id = this.parseRequiredParam(idParam, 'id');
    this.logger.log(`PUT /monitoring-results/:id/take started (pathId=${id})`);

    try {
      this.logger.log(`Calling takeMonitoringResultByIdUseCase (pathId=${id})`);
      const result = await this.takeMonitoringResultByIdUseCase.execute({
        monitoringResultId: id,
      });

      if (!result) {
        this.logger.warn(`PUT /monitoring-results/:id/take not found (pathId=${id})`);
        throw new NotFoundException('Monitoring result not found.');
      }

      this.logger.log(
        `PUT /monitoring-results/:id/take succeeded (pathId=${id}, integrationId=${result.integrationId}, riskObjectId=${result.riskObjectId})`,
      );
      return {
        integrationId: result.integrationId,
        riskobjectId: result.riskObjectId,
        data: result.data,
        mappingRules: result.mappingRules,
      };
    } catch (error) {
      if (error instanceof DomainValidationError) {
        this.logger.warn(`PUT /monitoring-results/:id/take validation failed (pathId=${id}): ${error.message}`);
        throw new BadRequestException(error.message);
      }

      this.logger.error(
        `PUT /monitoring-results/:id/take failed (pathId=${id}): ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  private parseRequiredParam(rawValue: string | undefined, fieldName: string): string {
    if (!rawValue?.trim()) {
      throw new BadRequestException(`${fieldName} path parameter is required.`);
    }

    return rawValue.trim();
  }
}
