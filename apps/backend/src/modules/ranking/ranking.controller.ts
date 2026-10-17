import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RankingService } from './ranking.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Ranking')
@ApiBearerAuth()
@Controller('ranking')
export class RankingController {
  constructor(private rankingService: RankingService) {}

  @Get('monthly')
  @Public()
  @ApiOperation({ summary: 'Ranking de este mes en una carrera' })
  @ApiResponse({ status: 200, description: 'Top 10 del mes en la carrera' })
  @ApiResponse({ status: 404, description: 'Carrera no encontrada' })
  monthly(
    @Query('careerId', new ParseUUIDPipe({ optional: true }))
    careerId?: string,
  ) {
    return this.rankingService.monthly(careerId);
  }

  @Get('monthly/me')
  @ApiOperation({ summary: 'Mi posición en el ranking de este mes' })
  @ApiResponse({ status: 200, description: 'Posición y carrera por defecto' })
  monthlyMe(
    @Request() req: { user: { id: string } },
    @Query('careerId', new ParseUUIDPipe({ optional: true }))
    careerId?: string,
  ) {
    return this.rankingService.monthlyMe(req.user.id, careerId);
  }

  @Get('legends')
  @Public()
  @ApiOperation({ summary: 'Leyendas de una facultad' })
  @ApiResponse({ status: 200, description: 'Leyendas, en orden alfabético' })
  @ApiResponse({ status: 404, description: 'Facultad no encontrada' })
  legends(
    @Query('facultyId', new ParseUUIDPipe({ optional: true }))
    facultyId?: string,
  ) {
    return this.rankingService.legends(facultyId);
  }

  @Get('legends/me')
  @ApiOperation({ summary: 'Mi facultad por defecto para Leyendas' })
  @ApiResponse({ status: 200, description: 'Facultad por defecto' })
  legendsMe(@Request() req: { user: { id: string } }) {
    return this.rankingService.legendsMe(req.user.id);
  }

  @Get('levels')
  @Public()
  @ApiOperation({ summary: 'Obtener tabla de niveles RPG' })
  @ApiResponse({ status: 200, description: 'Tabla de niveles RPG' })
  async getLevels() {
    return this.rankingService.getLevelThresholds();
  }
}

/** «Más útiles este cuatrimestre» on the materia page (openspec reputation/rankings). */
@ApiTags('Ranking')
@Controller('subjects')
export class SubjectTopMaterialsController {
  constructor(private rankingService: RankingService) {}

  @Get(':code/top-materials')
  @Public()
  @ApiOperation({
    summary: 'Materiales más útiles de la materia este cuatrimestre',
  })
  @ApiResponse({ status: 200, description: 'Top 10 por «Me sirvió» válidos' })
  @ApiResponse({ status: 404, description: 'Materia no encontrada' })
  topMaterials(@Param('code') code: string) {
    return this.rankingService.topMaterials(code);
  }
}
