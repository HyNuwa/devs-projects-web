import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExamFormat, ExamSession, Shift } from '../../../generated/prisma';
import { DiscoveryCourseReviewDto } from './discovery-course-reviews.dto';
import { DiscoveryExamExperienceDto } from './discovery-exam-experiences.dto';

export class RelatedProfessorDto {
  @ApiPropertyOptional({ format: 'uuid' })
  id?: string;

  @ApiProperty()
  name: string;
}

export class ReviewSharedContextDto {
  @ApiPropertyOptional({ type: RelatedProfessorDto })
  professor?: RelatedProfessorDto;

  @ApiPropertyOptional({ enum: Shift })
  shift?: Shift;
}

export class CourseReviewRelatedDto {
  @ApiPropertyOptional({
    type: ReviewSharedContextDto,
    nullable: true,
    description: 'Null when the reseña declared neither professor nor franja.',
  })
  sharedContext: ReviewSharedContextDto | null;

  @ApiProperty({ type: [DiscoveryCourseReviewDto] })
  items: DiscoveryCourseReviewDto[];
}

export class ExamSharedContextDto {
  @ApiPropertyOptional({ enum: ExamSession })
  session?: ExamSession;

  @ApiProperty({ enum: ExamFormat })
  format: ExamFormat;
}

export class ExamExperienceRelatedDto {
  @ApiProperty({ type: ExamSharedContextDto })
  sharedContext: ExamSharedContextDto;

  @ApiProperty({ type: [DiscoveryExamExperienceDto] })
  items: DiscoveryExamExperienceDto[];
}
