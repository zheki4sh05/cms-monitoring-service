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
import { CreateRiskObjectUseCase } from '../../core/risk-object/use-cases/create-risk-object.use-case.js';
import { GetRiskObjectChangeHistoryByIdUseCase } from '../../core/risk-object/use-cases/get-risk-object-change-history-by-id.use-case.js';
import { GetRiskObjectChangeHistoryUseCase } from '../../core/risk-object/use-cases/get-risk-object-change-history.use-case.js';
import { GetRiskObjectByIdUseCase } from '../../core/risk-object/use-cases/get-risk-object-by-id.use-case.js';
import { GetRiskObjectByUuidUseCase } from '../../core/risk-object/use-cases/get-risk-object-by-uuid.use-case.js';
import { GetRiskObjectModelsUseCase } from '../../core/risk-object/use-cases/get-risk-object-models.use-case.js';
import { GetRiskObjectsUseCase } from '../../core/risk-object/use-cases/get-risk-objects.use-case.js';
import { UpdateRiskObjectByIdUseCase } from '../../core/risk-object/use-cases/update-risk-object-by-id.use-case.js';
import { UpdateRiskObjectStatusUseCase } from '../../core/risk-object/use-cases/update-risk-object-status.use-case.js';
import type { AuthenticatedUser } from '../../core/auth/domain/authenticated-user.js';
import { DomainValidationError } from '../../core/shared/errors/domain-validation.error.js';
import { CreateRiskObjectRequestDto } from './dto/create-risk-object-request.dto.js';
import { GetRiskObjectChangeHistoryByIdResponseDto } from './dto/get-risk-object-change-history-by-id-response.dto.js';
import { CreateRiskObjectResponseDto } from './dto/create-risk-object-response.dto.js';
import { GetRiskObjectChangeHistoryResponseDto } from './dto/get-risk-object-change-history-response.dto.js';
import { GetRiskObjectByIdResponseDto } from './dto/get-risk-object-by-id-response.dto.js';
import { GetRiskObjectModelsResponseDto } from './dto/get-risk-object-models-response.dto.js';
import { GetRiskObjectsResponseDto } from './dto/get-risk-objects-response.dto.js';
import { PutRiskObjectByIdRequestDto } from './dto/put-risk-object-by-id-request.dto.js';
import { PutRiskObjectByIdResponseDto } from './dto/put-risk-object-by-id-response.dto.js';
import { PutRiskObjectStatusRequestDto } from './dto/put-risk-object-status-request.dto.js';
import type { Request } from 'express';
import { Public } from '../auth/public.decorator.js';

type RequestWithAuthUser = Request & {
  authenticatedUser?: AuthenticatedUser;
};

@ApiTags('Risk Objects')
@ApiBearerAuth('bearer')
@Controller()
export class RiskObjectController {
  constructor(
    private readonly createRiskObjectUseCase: CreateRiskObjectUseCase,
    private readonly getRiskObjectChangeHistoryUseCase: GetRiskObjectChangeHistoryUseCase,
    private readonly getRiskObjectChangeHistoryByIdUseCase: GetRiskObjectChangeHistoryByIdUseCase,
    private readonly getRiskObjectModelsUseCase: GetRiskObjectModelsUseCase,
    private readonly getRiskObjectsUseCase: GetRiskObjectsUseCase,
    private readonly getRiskObjectByIdUseCase: GetRiskObjectByIdUseCase,
    private readonly getRiskObjectByUuidUseCase: GetRiskObjectByUuidUseCase,
    private readonly updateRiskObjectByIdUseCase: UpdateRiskObjectByIdUseCase,
    private readonly updateRiskObjectStatusUseCase: UpdateRiskObjectStatusUseCase,
  ) {}

  @ApiOperation({ summary: 'Создать рисковый объект' })
  @ApiHeader({ name: 'CompanyId', required: true, description: 'ID компании' })
  @ApiBody({ type: CreateRiskObjectRequestDto })
  @ApiCreatedResponse({ type: CreateRiskObjectResponseDto })
  @Post('risk-objects')
  async createRiskObject(
    @Headers('companyid') companyIdHeader: string | undefined,
    @Body() body: CreateRiskObjectRequestDto,
    @Req() request: RequestWithAuthUser,
  ): Promise<CreateRiskObjectResponseDto> {
    const companyId = this.parseRequiredHeader(companyIdHeader, 'CompanyId');
    const authorId = this.parseRequiredHeader(request.authenticatedUser?.userId, 'userId');

    try {
      const riskObject = await this.createRiskObjectUseCase.execute({
        companyId,
        authorId,
        name: body.name,
        definition: body.definition,
      });

      return {
        id: riskObject.id,
        savedAt: riskObject.createdAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @ApiOperation({ summary: 'История изменений рисковых объектов' })
  @ApiHeader({ name: 'CompanyId', required: true, description: 'ID компании' })
  @ApiQuery({ name: 'page', required: true, example: 1 })
  @ApiQuery({ name: 'pageSize', required: true, example: 5 })
  @ApiQuery({ name: 'q', required: false, example: 'иванов' })
  @ApiOkResponse({ type: GetRiskObjectChangeHistoryResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректные параметры page/pageSize/q' })
  @Get('risk-objects/change-history')
  async getRiskObjectChangeHistory(
    @Headers('companyid') companyIdHeader: string | undefined,
    @Query('page') pageQuery?: string,
    @Query('pageSize') pageSizeQuery?: string,
    @Query('q') qQuery?: string,
  ): Promise<GetRiskObjectChangeHistoryResponseDto> {
    const companyId = this.parseRequiredHeader(companyIdHeader, 'CompanyId');
    const page = this.parseRequiredPositiveInt(pageQuery, 'page');
    const pageSize = this.parseRequiredPositiveInt(pageSizeQuery, 'pageSize');

    try {
      const historyRequest: {
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
        historyRequest.q = qQuery;
      }

      const result = await this.getRiskObjectChangeHistoryUseCase.execute(historyRequest);

      return {
        items: result.items.map((item) => ({
          id: item.id,
          riskObjectId: item.riskObjectId,
          name: item.name,
          changeComment: item.changeComment,
          status: item.status,
          changedAt: item.changedAt.toISOString(),
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

  @ApiOperation({ summary: 'Краткий список моделей рисковых объектов (id и name)' })
  @ApiHeader({ name: 'CompanyId', required: true, description: 'ID компании' })
  @ApiOkResponse({ type: GetRiskObjectModelsResponseDto })
  @Get('risk-object-models')
  async getRiskObjectModels(
    @Headers('companyid') companyIdHeader: string | undefined,
  ): Promise<GetRiskObjectModelsResponseDto> {
    const companyId = this.parseRequiredHeader(companyIdHeader, 'CompanyId');

    try {
      const items = await this.getRiskObjectModelsUseCase.execute({ companyId });
      return { items };
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @ApiOperation({ summary: 'Список рисковых объектов' })
  @ApiHeader({ name: 'CompanyId', required: true, description: 'ID компании' })
  @ApiQuery({ name: 'page', required: true, example: 1 })
  @ApiQuery({ name: 'pageSize', required: true, example: 10 })
  @ApiOkResponse({ type: GetRiskObjectsResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректные параметры page/pageSize' })
  @Get('risk-objects')
  async getRiskObjects(
    @Headers('companyid') companyIdHeader: string | undefined,
    @Query('page') pageQuery?: string,
    @Query('pageSize') pageSizeQuery?: string,
  ): Promise<GetRiskObjectsResponseDto> {
    const companyId = this.parseRequiredHeader(companyIdHeader, 'CompanyId');
    const page = this.parseRequiredPositiveInt(pageQuery, 'page');
    const pageSize = this.parseRequiredPositiveInt(pageSizeQuery, 'pageSize');

    try {
      const result = await this.getRiskObjectsUseCase.execute({ companyId, page, pageSize });
      return {
        items: result.items.map((item) => ({
          id: item.id,
          code: item.code,
          name: item.name,
          status: item.status,
          updatedAt: item.updatedAt.toISOString(),
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

  @ApiOperation({ summary: 'Детали рискового объекта' })
  @ApiHeader({ name: 'CompanyId', required: true, description: 'ID компании' })
  @ApiParam({ name: 'id', required: true, example: 'ro-1' })
  @ApiOkResponse({ type: GetRiskObjectByIdResponseDto })
  @ApiNotFoundResponse({ description: 'Рисковый объект не найден' })
  @ApiBadRequestResponse({ description: 'Некорректный id или CompanyId' })
  @Get('risk-objects/:id')
  async getRiskObjectById(
    @Headers('companyid') companyIdHeader: string | undefined,
    @Param('id') id: string | undefined,
  ): Promise<GetRiskObjectByIdResponseDto> {
    const companyId = this.parseRequiredHeader(companyIdHeader, 'CompanyId');

    try {
      const riskObject = await this.getRiskObjectByIdUseCase.execute({
        companyId,
        id: id ?? '',
      });

      if (!riskObject) {
        throw new NotFoundException('Risk object not found.');
      }

      return {
        id: riskObject.id,
        uuid: riskObject.uuid,
        code: riskObject.code,
        name: riskObject.name,
        status: riskObject.status,
        updatedAt: riskObject.updatedAt.toISOString(),
        definition: JSON.stringify(riskObject.definition),
      };
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @Public()
  @ApiOperation({ summary: 'Внутренний API: получить рисковый объект по uuid (только локальный вызов)' })
  @ApiHeader({ name: 'CompanyId', required: true, description: 'ID компании' })
  @ApiParam({ name: 'id', required: true, example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiOkResponse({ type: GetRiskObjectByIdResponseDto })
  @ApiNotFoundResponse({ description: 'Рисковый объект не найден' })
  @ApiBadRequestResponse({
    description: 'Некорректный uuid/CompanyId или запрос не является локальным межсервисным вызовом',
  })
  @Get('internal/risk-objects/:id')
  async getRiskObjectByIdForInterservice(
    @Headers('companyid') companyIdHeader: string | undefined,
    @Param('id') uuidParam: string | undefined,
    @Req() request: Request,
  ): Promise<GetRiskObjectByIdResponseDto> {
    this.assertLocalRequestOnly(request);
    const companyId = this.parseRequiredHeader(companyIdHeader, 'CompanyId');

    try {
      const riskObject = await this.getRiskObjectByUuidUseCase.execute({
        companyId,
        uuid: uuidParam ?? '',
      });

      if (!riskObject) {
        throw new NotFoundException('Risk object not found.');
      }

      return {
        id: riskObject.id,
        uuid: riskObject.uuid,
        code: riskObject.code,
        name: riskObject.name,
        status: riskObject.status,
        updatedAt: riskObject.updatedAt.toISOString(),
        definition: JSON.stringify(riskObject.definition),
      };
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @ApiOperation({ summary: 'Обновление рискового объекта' })
  @ApiHeader({ name: 'CompanyId', required: true, description: 'ID компании' })
  @ApiParam({ name: 'id', required: true, example: 'ro-1' })
  @ApiBody({ type: PutRiskObjectByIdRequestDto })
  @ApiOkResponse({ type: PutRiskObjectByIdResponseDto })
  @ApiNotFoundResponse({ description: 'Рисковый объект не найден' })
  @ApiBadRequestResponse({ description: 'Некорректный id, CompanyId или тело запроса' })
  @Put('risk-objects/:id')
  async putRiskObjectById(
    @Headers('companyid') companyIdHeader: string | undefined,
    @Param('id') id: string | undefined,
    @Body() body: PutRiskObjectByIdRequestDto,
    @Req() request: RequestWithAuthUser,
  ): Promise<PutRiskObjectByIdResponseDto> {
    const companyId = this.parseRequiredHeader(companyIdHeader, 'CompanyId');
    const riskObjectId = this.parseRequiredHeader(id, 'id');
    const authorName = request.authenticatedUser?.username?.trim() || 'Unknown';
    const lastModifiedBy = this.parseRequiredHeader(request.authenticatedUser?.userId, 'userId');

    try {
      const updateRequest: {
        companyId: string;
        id: string;
        lastModifiedBy: string;
        name: string;
        definition: Record<string, unknown>;
        changeComment: string;
        authorName: string;
      } = {
        companyId,
        id: riskObjectId,
        lastModifiedBy,
        name: body.name,
        definition: body.definition,
        changeComment: body.changeComment,
        authorName,
      };

      const savedAt = await this.updateRiskObjectByIdUseCase.execute(updateRequest);

      if (!savedAt) {
        throw new NotFoundException('Risk object not found.');
      }

      return {
        id: riskObjectId,
        savedAt: savedAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @ApiOperation({ summary: 'Смена статуса рискового объекта' })
  @ApiHeader({ name: 'CompanyId', required: true, description: 'ID компании' })
  @ApiParam({ name: 'id', required: true, example: 'ro-1' })
  @ApiBody({ type: PutRiskObjectStatusRequestDto })
  @ApiOkResponse({ type: PutRiskObjectByIdResponseDto })
  @ApiNotFoundResponse({ description: 'Рисковый объект не найден' })
  @ApiBadRequestResponse({ description: 'Некорректный id, CompanyId или status' })
  @Put('risk-objects/:id/status')
  async putRiskObjectStatus(
    @Headers('companyid') companyIdHeader: string | undefined,
    @Param('id') id: string | undefined,
    @Body() body: PutRiskObjectStatusRequestDto,
  ): Promise<PutRiskObjectByIdResponseDto> {
    const companyId = this.parseRequiredHeader(companyIdHeader, 'CompanyId');
    const riskObjectId = this.parseRequiredHeader(id, 'id');

    try {
      const savedAt = await this.updateRiskObjectStatusUseCase.execute({
        companyId,
        id: riskObjectId,
        status: body.status,
      });

      if (!savedAt) {
        throw new NotFoundException('Risk object not found.');
      }

      return {
        id: riskObjectId,
        savedAt: savedAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @ApiOperation({ summary: 'Детали записи истории изменений' })
  @ApiHeader({ name: 'CompanyId', required: true, description: 'ID компании' })
  @ApiParam({ name: 'historyId', required: true, example: 'roh-12' })
  @ApiOkResponse({ type: GetRiskObjectChangeHistoryByIdResponseDto })
  @ApiNotFoundResponse({ description: 'Запись истории не найдена' })
  @ApiBadRequestResponse({ description: 'Некорректный historyId или CompanyId' })
  @Get('risk-objects/change-history/:historyId')
  async getRiskObjectChangeHistoryById(
    @Headers('companyid') companyIdHeader: string | undefined,
    @Param('historyId') historyIdParam: string | undefined,
  ): Promise<GetRiskObjectChangeHistoryByIdResponseDto> {
    const companyId = this.parseRequiredHeader(companyIdHeader, 'CompanyId');
    const historyId = this.parseRequiredHeader(historyIdParam, 'historyId');

    try {
      const historyRecord = await this.getRiskObjectChangeHistoryByIdUseCase.execute({
        companyId,
        historyId,
      });

      if (!historyRecord) {
        throw new NotFoundException('Risk object change history record not found.');
      }

      return {
        id: `roh-${historyRecord.id}`,
        riskObjectId: historyRecord.riskObjectId,
        changedAt: historyRecord.changedAt.toISOString(),
        riskObjectName: historyRecord.riskObjectName,
        description: historyRecord.description,
        authorName: historyRecord.authorName,
      };
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
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

  private parseRequiredHeader(rawValue: string | undefined, headerName: string): string {
    if (!rawValue?.trim()) {
      throw new BadRequestException(`${headerName} header is required.`);
    }

    return rawValue.trim();
  }

  private assertLocalRequestOnly(request: Request): void {
    const remoteAddress = request.socket?.remoteAddress?.trim();
    const isLocalRequest =
      remoteAddress === '127.0.0.1' ||
      remoteAddress === '::1' ||
      remoteAddress === '::ffff:127.0.0.1';

    if (!isLocalRequest) {
      throw new BadRequestException('Only local interservice requests are allowed.');
    }
  }

}
