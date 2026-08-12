import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { ProfessorsQueryDto } from './dto/professors-query.dto';

@Injectable()
export class ProfessorsService {
  constructor(private prisma: PrismaService) {}

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
        include: {
          subjects: { include: { subject: true } },
        },
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
      },
    });

    if (!professor) {
      throw new NotFoundException('Profesor no encontrado');
    }

    return professor;
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
}
