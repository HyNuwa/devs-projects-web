import { Injectable, NotFoundException } from '@nestjs/common';
import { MaterialResourceType, Prisma } from '../../generated/prisma';
import { normalizeSearchKey } from '../../common/search/search-key';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DEFAULT_DISCOVERY_SUGGESTION_LIMIT,
  DiscoverySuggestionsQueryDto,
} from './dto/discovery-suggestions-query.dto';
import { DiscoverySuggestionsResponseDto } from './dto/discovery-suggestions-response.dto';
import {
  DEFAULT_DISCOVERY_HIERARCHY_LIMIT,
  DiscoveryCareerListDto,
  DiscoveryCurriculumYearListDto,
  DiscoveryHierarchyQueryDto,
  DiscoveryMaterialFileListDto,
  DiscoveryResourceCategoryListDto,
  DiscoverySubjectListDto,
} from './dto/discovery-hierarchy.dto';

const subjectSuggestionSelect = {
  id: true,
  code: true,
  name: true,
  searchKey: true,
} satisfies Prisma.SubjectSelect;

const materialSuggestionSelect = {
  id: true,
  title: true,
  searchKey: true,
  resourceType: true,
  subject: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
} satisfies Prisma.MaterialSelect;

const publicMaterialWhere = {
  isDeleted: false,
  moderationStatus: 'APPROVED',
} satisfies Prisma.MaterialWhereInput;

@Injectable()
export class DiscoveryService {
  constructor(private readonly prisma: PrismaService) {}

  private getHierarchyLimit(query: DiscoveryHierarchyQueryDto): number {
    return query.limit ?? DEFAULT_DISCOVERY_HIERARCHY_LIMIT;
  }

  private toBoundedList<T>(items: T[], limit: number) {
    return {
      items: items.slice(0, limit),
      hasMore: items.length > limit,
    };
  }

  async getSuggestions(
    query: DiscoverySuggestionsQueryDto,
  ): Promise<DiscoverySuggestionsResponseDto> {
    const normalizedQuery = normalizeSearchKey(query.q);
    const limit = query.limit ?? DEFAULT_DISCOVERY_SUGGESTION_LIMIT;

    const [subjects, materials] = await Promise.all([
      this.prisma.subject.findMany({
        where: { searchKey: { contains: normalizedQuery } },
        orderBy: [{ searchKey: 'asc' }, { id: 'asc' }],
        take: limit,
        select: subjectSuggestionSelect,
      }),
      this.prisma.material.findMany({
        where: {
          searchKey: { contains: normalizedQuery },
          isDeleted: false,
          moderationStatus: 'APPROVED',
        },
        orderBy: [{ searchKey: 'asc' }, { id: 'asc' }],
        take: limit,
        select: materialSuggestionSelect,
      }),
    ]);

    return {
      subjects: subjects
        .filter((subject) => subject.searchKey.includes(normalizedQuery))
        .map(({ searchKey: _searchKey, ...subject }) => ({
          kind: 'SUBJECT' as const,
          ...subject,
        })),
      materials: materials
        .filter((material) => material.searchKey.includes(normalizedQuery))
        .map(({ searchKey: _searchKey, ...material }) => ({
          kind: 'MATERIAL' as const,
          ...material,
        })),
    };
  }

  async getCareers(
    query: DiscoveryHierarchyQueryDto,
  ): Promise<DiscoveryCareerListDto> {
    const limit = this.getHierarchyLimit(query);
    const careers = await this.prisma.career.findMany({
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take: limit + 1,
      select: {
        id: true,
        name: true,
        code: true,
        _count: { select: { studyPlans: true } },
      },
    });
    const bounded = this.toBoundedList(careers, limit);

    return {
      careers: bounded.items.map(({ _count, ...career }) => ({
        ...career,
        studyPlanCount: _count.studyPlans,
      })),
      hasMore: bounded.hasMore,
    };
  }

  async getCurriculumYears(
    careerId: string,
    query: DiscoveryHierarchyQueryDto,
  ): Promise<DiscoveryCurriculumYearListDto> {
    const limit = this.getHierarchyLimit(query);
    const [career, yearGroups] = await Promise.all([
      this.prisma.career.findUnique({
        where: { id: careerId },
        select: {
          id: true,
          name: true,
          code: true,
          _count: { select: { studyPlans: true } },
        },
      }),
      this.prisma.studyPlanSubject.groupBy({
        by: ['studyPlanId', 'year'],
        where: { studyPlan: { careerId } },
        _count: { _all: true },
        orderBy: [{ year: 'asc' }, { studyPlanId: 'asc' }],
        take: limit + 1,
      }),
    ]);

    if (!career) {
      throw new NotFoundException('Carrera no encontrada');
    }

    const studyPlanIds = yearGroups.map((group) => group.studyPlanId);
    const studyPlans =
      studyPlanIds.length === 0
        ? []
        : await this.prisma.studyPlan.findMany({
            where: { id: { in: studyPlanIds }, careerId },
            select: { id: true, name: true, code: true },
          });
    const studyPlanById = new Map(
      studyPlans.map((studyPlan) => [studyPlan.id, studyPlan]),
    );
    const years = yearGroups
      .flatMap((group) => {
        const studyPlan = studyPlanById.get(group.studyPlanId);
        return studyPlan
          ? [
              {
                id: `${studyPlan.id}:${group.year}`,
                year: group.year,
                studyPlan,
                subjectCount: group._count._all,
              },
            ]
          : [];
      })
      .sort(
        (left, right) =>
          left.year - right.year ||
          left.studyPlan.code.localeCompare(right.studyPlan.code) ||
          left.studyPlan.id.localeCompare(right.studyPlan.id),
      );
    const bounded = this.toBoundedList(years, limit);

    return {
      career: {
        id: career.id,
        name: career.name,
        code: career.code,
        studyPlanCount: career._count.studyPlans,
      },
      years: bounded.items,
      hasMore: bounded.hasMore,
    };
  }

  async getSubjects(
    careerId: string,
    studyPlanId: string,
    year: number,
    query: DiscoveryHierarchyQueryDto,
  ): Promise<DiscoverySubjectListDto> {
    const limit = this.getHierarchyLimit(query);
    const studyPlan = await this.prisma.studyPlan.findFirst({
      where: { id: studyPlanId, careerId },
      select: {
        id: true,
        name: true,
        code: true,
        career: {
          select: {
            id: true,
            name: true,
            code: true,
            _count: { select: { studyPlans: true } },
          },
        },
      },
    });

    if (!studyPlan) {
      throw new NotFoundException('Plan de estudios no encontrado');
    }

    const curriculumSubjects = await this.prisma.studyPlanSubject.findMany({
      where: { studyPlanId, year },
      orderBy: [{ subject: { name: 'asc' } }, { id: 'asc' }],
      take: limit + 1,
      select: {
        id: true,
        semester: true,
        credits: true,
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            _count: {
              select: { materials: { where: publicMaterialWhere } },
            },
          },
        },
      },
    });
    const bounded = this.toBoundedList(curriculumSubjects, limit);

    return {
      career: {
        id: studyPlan.career.id,
        name: studyPlan.career.name,
        code: studyPlan.career.code,
        studyPlanCount: studyPlan.career._count.studyPlans,
      },
      studyPlan: {
        id: studyPlan.id,
        name: studyPlan.name,
        code: studyPlan.code,
      },
      year,
      subjects: bounded.items.map((curriculumSubject) => ({
        id: curriculumSubject.subject.id,
        curriculumAssignmentId: curriculumSubject.id,
        name: curriculumSubject.subject.name,
        code: curriculumSubject.subject.code,
        semester: curriculumSubject.semester,
        credits: curriculumSubject.credits,
        approvedMaterialCount: curriculumSubject.subject._count.materials,
      })),
      hasMore: bounded.hasMore,
    };
  }

  async getResourceCategories(
    subjectId: string,
  ): Promise<DiscoveryResourceCategoryListDto> {
    const [subject, categories] = await Promise.all([
      this.prisma.subject.findUnique({
        where: { id: subjectId },
        select: { id: true, name: true, code: true },
      }),
      this.prisma.material.groupBy({
        by: ['resourceType'],
        where: { subjectId, ...publicMaterialWhere },
        _count: { _all: true },
        orderBy: { resourceType: 'asc' },
      }),
    ]);

    if (!subject) {
      throw new NotFoundException('Materia no encontrada');
    }

    return {
      subject,
      categories: categories.map((category) => ({
        id: category.resourceType,
        resourceType: category.resourceType,
        materialCount: category._count._all,
      })),
    };
  }

  async getMaterialFiles(
    subjectId: string,
    resourceType: MaterialResourceType,
    query: DiscoveryHierarchyQueryDto,
  ): Promise<DiscoveryMaterialFileListDto> {
    const limit = this.getHierarchyLimit(query);
    const [subject, materials] = await Promise.all([
      this.prisma.subject.findUnique({
        where: { id: subjectId },
        select: { id: true, name: true, code: true },
      }),
      this.prisma.material.findMany({
        where: { subjectId, resourceType, ...publicMaterialWhere },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        take: limit + 1,
        select: {
          id: true,
          title: true,
          fileType: true,
          resourceType: true,
          academicYear: true,
          createdAt: true,
        },
      }),
    ]);

    if (!subject) {
      throw new NotFoundException('Materia no encontrada');
    }

    const bounded = this.toBoundedList(materials, limit);
    return {
      subject,
      resourceType,
      files: bounded.items,
      hasMore: bounded.hasMore,
    };
  }
}
