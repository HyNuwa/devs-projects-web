import {
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ModerationTargetType } from '../../generated/prisma';
import { materialUploadOptions } from '../materials/material-upload.options';
import { MaterialsService } from '../materials/materials.service';
import { SubjectsService } from '../subjects/subjects.service';
import { SubmissionsService } from './submissions.service';
import { RequiresActiveAccount } from '../moderation/active-account.guard';

type AuthenticatedRequest = { user: { id: string } };

@ApiTags('Submissions')
@ApiBearerAuth()
@Controller('me/submissions')
export class SubmissionsController {
  constructor(
    private readonly submissions: SubmissionsService,
    private readonly materials: MaterialsService,
    private readonly subjects: SubjectsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Mis envíos: estado de cada aporte propio' })
  list(@Request() req: AuthenticatedRequest) {
    return this.submissions.list(req.user.id);
  }

  @Post(':type/:id/resubmit')
  @RequiresActiveAccount()
  @ApiOperation({
    summary: 'Reenviar un aporte rechazado en revisión previa',
  })
  @UseInterceptors(FileInterceptor('file', materialUploadOptions))
  resubmit(
    @Request() req: AuthenticatedRequest,
    @Param('type', new ParseEnumPipe(ModerationTargetType))
    type: ModerationTargetType,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    switch (type) {
      case 'MATERIAL':
        return this.materials.resubmit(id, req.user.id, file);
      case 'COURSE_REVIEW':
        return this.subjects.resubmitReview(id, req.user.id);
      case 'EXAM_EXPERIENCE':
        return this.subjects.resubmitExam(id, req.user.id);
    }
  }
}
