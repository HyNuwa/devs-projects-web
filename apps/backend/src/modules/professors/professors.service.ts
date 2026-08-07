import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { ProfessorsQueryDto } from './dto/professors-query.dto';
import { PointService } from '../ranking/point.service';

@Injectable()
export class ProfessorsService {
  constructor(
    private prisma: PrismaService,
    private pointService: PointService,
  ) {}

  async findAll(query: ProfessorsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = query.subjectId
      ? { subjects: { some: { subjectId: query.subjectId } } }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.professor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { _count: { select: { reviews: true } } },
      }),
      this.prisma.professor.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const professor = await this.prisma.professor.findUnique({
      where: { id },
      include: {
        subjects: {
          include: { subject: true },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
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
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!professor) {
      throw new NotFoundException('Profesor no encontrado');
    }

    const avg = await this.prisma.professorReview.aggregate({
      where: { professorId: id },
      _avg: { value: true },
    });

    return {
      ...professor,
      avgRating: avg._avg.value,
    };
  }

  async create(dto: CreateProfessorDto) {
    const professor = await this.prisma.professor.create({
      data: {
        name: dto.name,
        bio: dto.bio,
      },
    });

    if (dto.subjectId) {
      await this.prisma.subjectProfessor.create({
        data: {
          professorId: professor.id,
          subjectId: dto.subjectId,
        },
      });
    }

    return this.findById(professor.id);
  }

  async update(id: string, dto: UpdateProfessorDto) {
    await this.findById(id);

    await this.prisma.professor.update({
      where: { id },
      data: {
        name: dto.name,
        bio: dto.bio,
      },
    });

    return this.findById(id);
  }

  async remove(id: string) {
    await this.findById(id);

    await this.prisma.professor.delete({
      where: { id },
    });

    return { message: 'Profesor eliminado correctamente' };
  }

  async evaluate(id: string, userId: string, dto: CreateReviewDto) {
    await this.findById(id);

    await this.prisma.professorReview.upsert({
      where: {
        userId_professorId: {
          userId,
          professorId: id,
        },
      },
      create: {
        userId,
        professorId: id,
        value: dto.value,
        description: dto.description,
      },
      update: {
        value: dto.value,
        description: dto.description,
      },
    });

    await this.pointService.awardPoints(userId, 5, 'PROFESSOR_EVALUATED', id);

    const avg = await this.prisma.professorReview.aggregate({
      where: { professorId: id },
      _avg: { value: true },
    });

    const professor = await this.prisma.professor.findUnique({
      where: { id },
      include: {
        subjects: {
          include: { subject: true },
        },
        _count: { select: { reviews: true } },
      },
    });

    return {
      ...professor,
      avgRating: avg._avg.value,
    };
  }

  async getReviews(id: string, query: ProfessorsQueryDto) {
    const professor = await this.prisma.professor.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!professor) {
      throw new NotFoundException('Profesor no encontrado');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = { professorId: id };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.professorReview.findMany({
        where,
        skip,
        take: limit,
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
      }),
      this.prisma.professorReview.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
