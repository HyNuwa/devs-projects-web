import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseReviewDto } from './dto/create-course-review.dto';
import { CreateExamExperienceDto } from './dto/create-exam-experience.dto';
import { PointService } from '../ranking/point.service';

@Injectable()
export class SubjectsService {
  constructor(
    private prisma: PrismaService,
    private pointService: PointService,
  ) {}

  async findAll() {
    return this.prisma.subject.findMany({
      select: { id: true, code: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });
  }

  async findByCode(code: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { code },
      include: {
        studyPlans: {
          include: { studyPlan: { include: { career: true } } },
        },
        professors: { include: { professor: true } },
      },
    });

    if (!subject) {
      throw new NotFoundException('Materia no encontrada');
    }

    const [reviewStats, examCount, materialCount] = await Promise.all([
      this.prisma.courseReview.aggregate({
        where: { subjectId: subject.id },
        _avg: { recommendation: true },
        _count: true,
      }),
      this.prisma.examExperience.count({ where: { subjectId: subject.id } }),
      this.prisma.material.count({
        where: {
          subjectId: subject.id,
          moderationStatus: 'APPROVED',
          isDeleted: false,
        },
      }),
    ]);

    return {
      ...subject,
      stats: {
        avgRecommendation: reviewStats._avg.recommendation,
        reviewCount: reviewStats._count,
        examCount,
        materialCount,
      },
    };
  }

  async getReviews(code: string) {
    const subject = await this.findByCode(code);
    const reviews = await this.prisma.courseReview.findMany({
      where: { subjectId: subject.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    const conditionBreakdown = await this.prisma.courseReview.groupBy({
      by: ['condition'],
      where: { subjectId: subject.id },
      _count: true,
    });

    return { reviews, conditionBreakdown };
  }

  async createReview(code: string, userId: string, dto: CreateCourseReviewDto) {
    const subject = await this.findByCode(code);

    const review = await this.prisma.courseReview.upsert({
      where: {
        userId_subjectId_shift: {
          userId,
          subjectId: subject.id,
          shift: dto.shift ?? 'NO_INDICO',
        },
      },
      create: {
        userId,
        subjectId: subject.id,
        shift: dto.shift ?? 'NO_INDICO',
        condition: dto.condition ?? 'PREFIERO_NO_RESPONDER',
        recommendation: dto.recommendation,
        comment: dto.comment,
      },
      update: {
        condition: dto.condition ?? 'PREFIERO_NO_RESPONDER',
        recommendation: dto.recommendation,
        comment: dto.comment,
      },
    });

    await this.pointService.awardPoints(
      userId,
      5,
      'COURSE_REVIEWED',
      review.id,
    );

    return review;
  }

  async deleteReview(reviewId: string, userId: string) {
    const review = await this.prisma.courseReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Reseña no encontrada');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar esta reseña',
      );
    }

    await this.prisma.courseReview.delete({ where: { id: reviewId } });
    return { message: 'Reseña eliminada' };
  }

  async getExams(code: string) {
    const subject = await this.findByCode(code);
    const exams = await this.prisma.examExperience.findMany({
      where: { subjectId: subject.id },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        professor: { select: { id: true, name: true } },
      },
    });

    return exams;
  }

  async createExam(code: string, userId: string, dto: CreateExamExperienceDto) {
    const subject = await this.findByCode(code);

    const exam = await this.prisma.examExperience.create({
      data: {
        userId,
        subjectId: subject.id,
        shift: dto.shift,
        year: dto.year,
        session: dto.session ?? 'NO_RECUERDO',
        format: dto.format,
        professorId: dto.professorId,
        examinerName: dto.examinerName,
        difficultyTheory: dto.difficultyTheory,
        difficultyPractice: dto.difficultyPractice,
        comment: dto.comment,
      },
    });

    await this.pointService.awardPoints(
      userId,
      5,
      'EXAM_EXPERIENCE_SHARED',
      exam.id,
    );

    return exam;
  }

  async deleteExam(examId: string, userId: string) {
    const exam = await this.prisma.examExperience.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException('Experiencia de final no encontrada');
    }

    if (exam.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar esta experiencia',
      );
    }

    await this.prisma.examExperience.delete({ where: { id: examId } });
    return { message: 'Experiencia de final eliminada' };
  }
}
