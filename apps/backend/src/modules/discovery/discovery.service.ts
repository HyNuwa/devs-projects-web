import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { normalizeSearchKey } from '../../common/search/search-key';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DEFAULT_DISCOVERY_SUGGESTION_LIMIT,
  DiscoverySuggestionsQueryDto,
} from './dto/discovery-suggestions-query.dto';
import { DiscoverySuggestionsResponseDto } from './dto/discovery-suggestions-response.dto';

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

@Injectable()
export class DiscoveryService {
  constructor(private readonly prisma: PrismaService) {}

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
}
