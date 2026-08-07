import { Controller, Get, Query, Request } from '@nestjs/common';
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

  @Get()
  @Public()
  @ApiOperation({ summary: 'Obtener ranking de usuarios' })
  @ApiResponse({ status: 200, description: 'Leaderboard de usuarios' })
  async getLeaderboard(
    @Query('period') period: string = 'global',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 10;

    switch (period) {
      case 'weekly':
        return this.rankingService.getWeeklyLeaderboard(p, l);
      case 'monthly':
        return this.rankingService.getMonthlyLeaderboard(p, l);
      default:
        return this.rankingService.getGlobalLeaderboard(p, l);
    }
  }

  @Get('me')
  @ApiOperation({ summary: 'Obtener rango y nivel del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Rango y nivel del usuario' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async getMe(@Request() req: { user: { id: string } }) {
    const [rank, levelInfo] = await Promise.all([
      this.rankingService.getUserRank(req.user.id),
      this.rankingService.getLevelInfo(req.user.id),
    ]);

    return { ...rank, ...levelInfo };
  }

  @Get('levels')
  @Public()
  @ApiOperation({ summary: 'Obtener tabla de niveles RPG' })
  @ApiResponse({ status: 200, description: 'Tabla de niveles RPG' })
  async getLevels() {
    return this.rankingService.getLevelThresholds();
  }

  @Get('top')
  @Public()
  @ApiOperation({ summary: 'Obtener top 10 del ranking' })
  @ApiResponse({ status: 200, description: 'Top 10 usuarios' })
  async getTop() {
    return this.rankingService.getGlobalLeaderboard(1, 10);
  }
}
