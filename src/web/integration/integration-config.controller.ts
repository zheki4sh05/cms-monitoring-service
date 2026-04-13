import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateIntegrationConfigUseCase } from '../../core/integration/use-cases/create-integration-config.use-case.js';
import { GetIntegrationConfigByIdUseCase } from '../../core/integration/use-cases/get-integration-config-by-id.use-case.js';
import { GetIntegrationConfigChangeHistoryUseCase } from '../../core/integration/use-cases/get-integration-config-change-history.use-case.js';
import { GetIntegrationConfigsUseCase } from '../../core/integration/use-cases/get-integration-configs.use-case.js';
import { UpdateIntegrationConfigByIdUseCase } from '../../core/integration/use-cases/update-integration-config-by-id.use-case.js';
import { UpdateIntegrationConfigStatusUseCase } from '../../core/integration/use-cases/update-integration-config-status.use-case.js';
import type { AuthenticatedUser } from '../../core/auth/domain/authenticated-user.js';
import { DomainValidationError } from '../../core/shared/errors/domain-validation.error.js';
import { CreateIntegrationConfigRequestDto } from './dto/create-integration-config-request.dto.js';
import { CreateIntegrationConfigResponseDto } from './dto/create-integration-config-response.dto.js';
import { GetIntegrationConfigByIdResponseDto } from './dto/get-integration-config-by-id-response.dto.js';
import { GetIntegrationConfigChangeHistoryResponseDto } from './dto/get-integration-config-change-history-response.dto.js';
import { GetIntegrationConfigsResponseDto } from './dto/get-integration-configs-response.dto.js';
import { PutIntegrationConfigByIdRequestDto } from './dto/put-integration-config-by-id-request.dto.js';
import { PutIntegrationConfigByIdResponseDto } from './dto/put-integration-config-by-id-response.dto.js';
import { PutIntegrationConfigStatusRequestDto } from './dto/put-integration-config-status-request.dto.js';
import { PutIntegrationConfigStatusResponseDto } from './dto/put-integration-config-status-response.dto.js';
import type { Request } from 'express';

type RequestWithAuthUser = Request & {
  authenticatedUser?: AuthenticatedUser;
};

@ApiTags('Integration Configs')
@ApiBearerAuth('bearer')
@Controller()
export class IntegrationConfigController {
  constructor(
    private readonly createIntegrationConfigUseCase: CreateIntegrationConfigUseCase,
    private readonly getIntegrationConfigChangeHistoryUseCase: GetIntegrationConfigChangeHistoryUseCase,
    private readonly getIntegrationConfigsUseCase: GetIntegrationConfigsUseCase,
    private readonly getIntegrationConfigByIdUseCase: GetIntegrationConfigByIdUseCase,
    private readonly updateIntegrationConfigByIdUseCase: UpdateIntegrationConfigByIdUseCase,
    private readonly updateIntegrationConfigStatusUseCase: UpdateIntegrationConfigStatusUseCase,
  ) {}

  @ApiOperation({ summary: 'Создать integration-конфиг' })
  @ApiHeader({ name: 'CompanyId', required: true, description: 'ID компании' })
  @ApiBody({ type: CreateIntegrationConfigRequestDto })
  @ApiCreatedResponse({ type: CreateIntegrationConfigResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректный CompanyId или тело запроса' })
  @Post('integration-configs')
  async createIntegrationConfig(
    @Headers('companyid') companyIdHeader: string | undefined,
    @Body() body: CreateIntegrationConfigRequestDto,
    @Req() request: RequestWithAuthUser,
  ): Promise<CreateIntegrationConfigResponseDto> {
    const companyId = this.parseRequiredHeader(companyIdHeader, 'CompanyId');
    const authorName = request.authenticatedUser?.username?.trim() || 'Unknown';

    try {
      const created = await this.createIntegrationConfigUseCase.execute({
        companyId,
        authorName,
        name: body.name,
        integrationKind: body.integrationKind,
        endpointUrl: body.endpointUrl,
        riskObjectModelId: body.riskObjectModelId,
        mappingRules: body.mapping_rules,
      });

      return {
        id: created.id,
        savedAt: created.savedAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @ApiOperation({ summary: 'Таблица интеграций (постранично)' })
  @ApiHeader({ name: 'CompanyId', required: true, description: 'ID компании' })
  @ApiQuery({ name: 'page', required: true, example: 1 })
  @ApiQuery({ name: 'pageSize', required: true, example: 6 })
  @ApiOkResponse({ type: GetIntegrationConfigsResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректные параметры или CompanyId' })
  @Get('integration-configs')
  async getIntegrationConfigs(
    @Headers('companyid') companyIdHeader: string | undefined,
    @Query('page') pageQuery?: string,
    @Query('pageSize') pageSizeQuery?: string,
  ): Promise<GetIntegrationConfigsResponseDto> {
    const companyId = this.parseRequiredHeader(companyIdHeader, 'CompanyId');
    const page = this.parseRequiredPositiveInt(pageQuery, 'page');
    const pageSize = this.parseRequiredPositiveInt(pageSizeQuery, 'pageSize');

    try {
      const result = await this.getIntegrationConfigsUseCase.execute({
        companyId,
        page,
        pageSize,
      });

      return {
        items: result.items.map((item) => ({
          id: `ic-${item.id}`,
          number: item.number,
          name: item.name,
          updatedAt: item.updatedAt.toISOString(),
          status: item.status,
          authorName: item.authorName,
        })),
        hasMore: result.hasMore,
      };
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @ApiOperation({ summary: 'История изменений интеграций (постранично + поиск)' })
  @ApiHeader({ name: 'CompanyId', required: true, description: 'ID компании' })
  @ApiQuery({ name: 'page', required: true, example: 1 })
  @ApiQuery({ name: 'pageSize', required: true, example: 5 })
  @ApiQuery({ name: 'q', required: false, example: 'мария' })
  @ApiOkResponse({ type: GetIntegrationConfigChangeHistoryResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректные параметры page/pageSize/q или CompanyId' })
  @Get('integration-configs/change-history')
  async getIntegrationConfigChangeHistory(
    @Headers('companyid') companyIdHeader: string | undefined,
    @Query('page') pageQuery?: string,
    @Query('pageSize') pageSizeQuery?: string,
    @Query('q') qQuery?: string,
  ): Promise<GetIntegrationConfigChangeHistoryResponseDto> {
    const companyId = this.parseRequiredHeader(companyIdHeader, 'CompanyId');
    const page = this.parseRequiredPositiveInt(pageQuery, 'page');
    const pageSize = this.parseRequiredPositiveInt(pageSizeQuery, 'pageSize');

    try {
      const request: {
        companyId: string;
        page: number;
        pageSize: number;
        q?: string;
      } = {
        companyId,
        page,
        pageSize,
      };

      if (qQuery !== undefined) {
        request.q = qQuery;
      }

      const result = await this.getIntegrationConfigChangeHistoryUseCase.execute(request);
      return {
        items: result.items.map((item) => ({
          id: `hist-${item.id}`,
          integrationId: `ic-${item.integrationId}`,
          changedAt: item.changedAt.toISOString(),
          configName: item.configName,
          description: item.description,
          authorName: item.authorName,
        })),
        hasMore: result.hasMore,
      };
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @ApiOperation({ summary: 'Просмотр интеграции по id' })
  @ApiHeader({ name: 'CompanyId', required: true, description: 'ID компании' })
  @ApiParam({ name: 'id', required: true, example: 'ic-1' })
  @ApiOkResponse({ type: GetIntegrationConfigByIdResponseDto })
  @ApiNotFoundResponse({ description: 'Интеграция не найдена' })
  @ApiBadRequestResponse({ description: 'Некорректный id или CompanyId' })
  @Get('integration-configs/:id')
  async getIntegrationConfigById(
    @Headers('companyid') companyIdHeader: string | undefined,
    @Param('id') idParam: string | undefined,
  ): Promise<GetIntegrationConfigByIdResponseDto> {
    const companyId = this.parseRequiredHeader(companyIdHeader, 'CompanyId');
    const integrationConfigId = this.parseRequiredHeader(idParam, 'id');

    try {
      const config = await this.getIntegrationConfigByIdUseCase.execute({
        companyId,
        integrationConfigId,
      });

      if (!config) {
        throw new NotFoundException('Integration config not found.');
      }

      const mappingRules = Array.isArray(config.mappingRules) ? config.mappingRules : [];

      return {
        id: `ic-${config.id}`,
        number: config.number,
        name: config.name,
        integrationKind: config.integrationKind.toLowerCase() as 'push' | 'pull' | 'broker',
        endpointUrl: config.endpointUrl,
        riskObjectModelId: config.riskObjectModelId,
        mapping_rules: mappingRules as { from: string; to: string; transform?: string }[],
        status: config.status,
        authorName: config.authorName,
        updatedAt: config.updatedAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @ApiOperation({ summary: 'Сохранение изменений интеграции (без смены статуса)' })
  @ApiHeader({ name: 'CompanyId', required: true, description: 'ID компании' })
  @ApiParam({ name: 'id', required: true, example: 'ic-1' })
  @ApiBody({ type: PutIntegrationConfigByIdRequestDto })
  @ApiOkResponse({ type: PutIntegrationConfigByIdResponseDto })
  @ApiNotFoundResponse({ description: 'Интеграция не найдена' })
  @ApiBadRequestResponse({ description: 'Некорректный id, CompanyId или тело запроса' })
  @Put('integration-configs/:id')
  async putIntegrationConfigById(
    @Headers('companyid') companyIdHeader: string | undefined,
    @Param('id') idParam: string | undefined,
    @Body() body: PutIntegrationConfigByIdRequestDto,
    @Req() request: RequestWithAuthUser,
  ): Promise<PutIntegrationConfigByIdResponseDto> {
    const companyId = this.parseRequiredHeader(companyIdHeader, 'CompanyId');
    const integrationConfigId = this.parseRequiredHeader(idParam, 'id');
    const authorName = request.authenticatedUser?.username?.trim() || 'Unknown';

    try {
      const savedAt = await this.updateIntegrationConfigByIdUseCase.execute({
        companyId,
        integrationConfigId,
        name: body.name,
        integrationKind: body.integrationKind,
        endpointUrl: body.endpointUrl,
        riskObjectModelId: body.riskObjectModelId,
        mappingRules: body.mapping_rules,
        authorName,
      });

      if (!savedAt) {
        throw new NotFoundException('Integration config not found.');
      }

      return {
        id: integrationConfigId.startsWith('ic-') ? integrationConfigId : `ic-${integrationConfigId}`,
        savedAt: savedAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @ApiOperation({ summary: 'Отдельное изменение статуса интеграции' })
  @ApiHeader({ name: 'CompanyId', required: true, description: 'ID компании' })
  @ApiParam({ name: 'id', required: true, example: 'ic-1' })
  @ApiBody({ type: PutIntegrationConfigStatusRequestDto })
  @ApiOkResponse({ type: PutIntegrationConfigStatusResponseDto })
  @ApiNotFoundResponse({ description: 'Интеграция не найдена' })
  @ApiBadRequestResponse({ description: 'Некорректный id, CompanyId или status' })
  @Put('integration-configs/:id/status')
  async putIntegrationConfigStatus(
    @Headers('companyid') companyIdHeader: string | undefined,
    @Param('id') idParam: string | undefined,
    @Body() body: PutIntegrationConfigStatusRequestDto,
  ): Promise<PutIntegrationConfigStatusResponseDto> {
    const companyId = this.parseRequiredHeader(companyIdHeader, 'CompanyId');
    const integrationConfigId = this.parseRequiredHeader(idParam, 'id');

    try {
      const savedAt = await this.updateIntegrationConfigStatusUseCase.execute({
        companyId,
        integrationConfigId,
        status: body.status,
      });

      if (!savedAt) {
        throw new NotFoundException('Integration config not found.');
      }

      return {
        id: integrationConfigId.startsWith('ic-') ? integrationConfigId : `ic-${integrationConfigId}`,
        savedAt: savedAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  private parseRequiredHeader(rawValue: string | undefined, headerName: string): string {
    if (!rawValue?.trim()) {
      throw new BadRequestException(`${headerName} header is required.`);
    }

    return rawValue.trim();
  }

  private parseRequiredPositiveInt(rawValue: string | undefined, fieldName: string): number {
    if (!rawValue) {
      throw new BadRequestException(`${fieldName} query parameter is required.`);
    }

    const value = Number.parseInt(rawValue, 10);
    if (!Number.isInteger(value) || value < 1) {
      throw new BadRequestException(`${fieldName} must be an integer greater than or equal to 1.`);
    }

    return value;
  }
}
