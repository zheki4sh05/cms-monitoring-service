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
import { GetRiskObjectByIdUseCase } from '../../core/risk-object/use-cases/get-risk-object-by-id.use-case.js';
import { GetRiskObjectsUseCase } from '../../core/risk-object/use-cases/get-risk-objects.use-case.js';
import { UpdateRiskObjectByIdUseCase } from '../../core/risk-object/use-cases/update-risk-object-by-id.use-case.js';
import { DomainValidationError } from '../../core/shared/errors/domain-validation.error.js';
import { CreateRiskObjectRequestDto } from './dto/create-risk-object-request.dto.js';
import { CreateRiskObjectResponseDto } from './dto/create-risk-object-response.dto.js';
import { GetRiskObjectByIdResponseDto } from './dto/get-risk-object-by-id-response.dto.js';
import { GetRiskObjectsResponseDto } from './dto/get-risk-objects-response.dto.js';
import { PutRiskObjectByIdRequestDto } from './dto/put-risk-object-by-id-request.dto.js';
import { PutRiskObjectByIdResponseDto } from './dto/put-risk-object-by-id-response.dto.js';

@ApiTags('Risk Objects')
@ApiBearerAuth('bearer')
@Controller()
export class RiskObjectController {
  constructor(
    private readonly createRiskObjectUseCase: CreateRiskObjectUseCase,
    private readonly getRiskObjectsUseCase: GetRiskObjectsUseCase,
    private readonly getRiskObjectByIdUseCase: GetRiskObjectByIdUseCase,
    private readonly updateRiskObjectByIdUseCase: UpdateRiskObjectByIdUseCase,
  ) {}

  @ApiOperation({ summary: 'Создать рисковый объект' })
  @ApiHeader({ name: 'CompanyId', required: true, description: 'ID компании' })
  @ApiBody({ type: CreateRiskObjectRequestDto })
  @ApiCreatedResponse({ type: CreateRiskObjectResponseDto })
  @Post('risk-objects')
  async createRiskObject(
    @Headers('companyid') companyIdHeader: string | undefined,
    @Body() body: CreateRiskObjectRequestDto,
  ): Promise<CreateRiskObjectResponseDto> {
    const companyId = this.parseRequiredHeader(companyIdHeader, 'CompanyId');

    try {
      const riskObject = await this.createRiskObjectUseCase.execute({
        companyId,
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
  ): Promise<PutRiskObjectByIdResponseDto> {
    const companyId = this.parseRequiredHeader(companyIdHeader, 'CompanyId');
    const riskObjectId = this.parseRequiredHeader(id, 'id');

    try {
      const updateRequest: {
        companyId: string;
        id: string;
        name: string;
        definition: Record<string, unknown>;
        status?: 'active' | 'archived';
      } = {
        companyId,
        id: riskObjectId,
        name: body.name,
        definition: body.definition,
      };

      if (body.status !== undefined) {
        updateRequest.status = body.status;
      }

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

}
