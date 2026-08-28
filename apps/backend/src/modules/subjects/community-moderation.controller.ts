import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CommunityWriteThrottlerGuard } from '../../common/guards/community-write-throttler.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../auth/dto/auth-response.dto';
import { CommunityModerationService } from './community-moderation.service';
import {
  CommunityModerationReasonDto,
  CreateCommunityReportDto,
} from './dto/community-moderation.dto';

type AuthenticatedCommunityUser = {
  user: {
    id: string;
    role: Role;
  };
};

const MODERATION_ROLES = [Role.ADMIN, Role.MODERATOR, Role.SUPERADMIN] as const;

@ApiTags('Community moderation')
@ApiBearerAuth()
@Controller('subjects')
export class CommunityModerationController {
  constructor(
    private readonly communityModerationService: CommunityModerationService,
  ) {}

  @Post('reviews/:id/reports')
  @UseGuards(CommunityWriteThrottlerGuard)
  @ApiOperation({ summary: 'Reportar una reseña visible' })
  @ApiResponse({ status: 201, description: 'Reporte registrado' })
  reportReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedCommunityUser,
    @Body() dto: CreateCommunityReportDto,
  ) {
    return this.communityModerationService.reportReview(id, req.user.id, dto);
  }

  @Post('exams/:id/reports')
  @UseGuards(CommunityWriteThrottlerGuard)
  @ApiOperation({ summary: 'Reportar una experiencia de final visible' })
  @ApiResponse({ status: 201, description: 'Reporte registrado' })
  reportExam(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedCommunityUser,
    @Body() dto: CreateCommunityReportDto,
  ) {
    return this.communityModerationService.reportExam(id, req.user.id, dto);
  }

  @Get('reviews/:id/management')
  @ApiOperation({ summary: 'Ver estado privado de mi reseña' })
  getReviewManagementView(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedCommunityUser,
  ) {
    return this.communityModerationService.getReviewManagementView(
      id,
      req.user,
    );
  }

  @Get('exams/:id/management')
  @ApiOperation({ summary: 'Ver estado privado de mi experiencia de final' })
  getExamManagementView(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedCommunityUser,
  ) {
    return this.communityModerationService.getExamManagementView(id, req.user);
  }

  @Get('community/reports')
  @UseGuards(RolesGuard)
  @Roles(...MODERATION_ROLES)
  @ApiOperation({ summary: 'Listar reportes comunitarios para moderación' })
  listReports() {
    return this.communityModerationService.listReports();
  }

  @Post('reviews/:id/moderation/remove')
  @UseGuards(RolesGuard)
  @Roles(...MODERATION_ROLES)
  @ApiOperation({ summary: 'Retirar una reseña de la vista pública' })
  removeReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedCommunityUser,
    @Body() dto: CommunityModerationReasonDto,
  ) {
    return this.communityModerationService.removeReview(id, req.user.id, dto);
  }

  @Post('reviews/:id/moderation/restore')
  @UseGuards(RolesGuard)
  @Roles(...MODERATION_ROLES)
  @ApiOperation({ summary: 'Restaurar una reseña retirada' })
  restoreReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedCommunityUser,
    @Body() dto: CommunityModerationReasonDto,
  ) {
    return this.communityModerationService.restoreReview(id, req.user.id, dto);
  }

  @Post('exams/:id/moderation/remove')
  @UseGuards(RolesGuard)
  @Roles(...MODERATION_ROLES)
  @ApiOperation({ summary: 'Retirar una experiencia de la vista pública' })
  removeExam(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedCommunityUser,
    @Body() dto: CommunityModerationReasonDto,
  ) {
    return this.communityModerationService.removeExam(id, req.user.id, dto);
  }

  @Post('exams/:id/moderation/restore')
  @UseGuards(RolesGuard)
  @Roles(...MODERATION_ROLES)
  @ApiOperation({ summary: 'Restaurar una experiencia retirada' })
  restoreExam(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedCommunityUser,
    @Body() dto: CommunityModerationReasonDto,
  ) {
    return this.communityModerationService.restoreExam(id, req.user.id, dto);
  }
}
