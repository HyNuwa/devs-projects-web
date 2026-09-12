import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getHierarchyCareers,
  getHierarchyFiles,
  getHierarchySubjects,
} from '@/lib/discovery-hierarchy-client';
import { getMaterialDiscovery } from '@/lib/discovery-client';
import { MaterialHierarchyPage } from './MaterialHierarchyPage';

const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push, replace: navigation.replace }),
}));

vi.mock('@/lib/discovery-hierarchy-client', () => ({
  getHierarchyCareers: vi.fn(),
  getHierarchyCategories: vi.fn(),
  getHierarchyFiles: vi.fn(),
  getHierarchySubjects: vi.fn(),
  getHierarchyYears: vi.fn(),
}));

vi.mock('@/lib/discovery-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/discovery-client')>();

  return { ...actual, getMaterialDiscovery: vi.fn() };
});

const careerId = '10000000-0000-4000-8000-000000000001';
const studyPlanId = '20000000-0000-4000-8000-000000000002';
const subjectId = '30000000-0000-4000-8000-000000000003';

const subjectContext = {
  career: { id: careerId, name: 'Ingeniería Informática', code: 'INF', studyPlanCount: 1 },
  studyPlan: { id: studyPlanId, name: 'Plan 2024', code: 'INF-24' },
  year: 2,
  subjects: [
    {
      id: subjectId,
      curriculumAssignmentId: 'assignment-1',
      name: 'Estructuras de Datos',
      code: 'INF-201',
      semester: 1,
      credits: null,
      approvedMaterialCount: 2,
    },
  ],
  hasMore: false,
};

afterEach(cleanup);

describe('MaterialHierarchyPage', () => {
  beforeEach(() => {
    navigation.push.mockReset();
    navigation.replace.mockReset();
    vi.mocked(getHierarchyCareers).mockReset();
    vi.mocked(getHierarchyFiles).mockReset();
    vi.mocked(getHierarchySubjects).mockReset();
    vi.mocked(getMaterialDiscovery).mockReset();
  });

  it('starts at careers and exposes a stable route for each choice', async () => {
    vi.mocked(getHierarchyCareers).mockResolvedValue({
      careers: [{ id: careerId, name: 'Ingeniería Informática', code: 'INF', studyPlanCount: 1 }],
      hasMore: false,
    });

    render(<MaterialHierarchyPage query="" segments={[]} />);

    expect(await screen.findByRole('heading', { name: 'Elegí tu carrera' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ingeniería informática/i })).toHaveAttribute(
      'href',
      `/materiales/carreras/${careerId}`,
    );
  });

  it('honors shared root preview links without reloading the hierarchy', async () => {
    vi.mocked(getHierarchyCareers).mockResolvedValue({ careers: [], hasMore: false });
    const view = render(<MaterialHierarchyPage query="" segments={[]} />);
    await screen.findByRole('heading', { name: 'Elegí tu carrera' });
    view.rerender(<MaterialHierarchyPage query="" segments={[]} selectedFileId="material-1" />);
    expect(
      await screen.findByRole('dialog', { name: 'Vista previa: Recurso académico' }),
    ).toBeInTheDocument();
    expect(getHierarchyCareers).toHaveBeenCalledTimes(1);
  });

  it('uses the subject id for a shared materia-scoped search', async () => {
    vi.mocked(getHierarchySubjects).mockResolvedValue(subjectContext);
    vi.mocked(getMaterialDiscovery).mockResolvedValue({
      data: [
        {
          id: 'material-1',
          title: 'Guía de listas enlazadas',
          fileType: 'application/pdf',
          academicYear: 2026,
          createdAt: '2026-08-30T12:00:00.000Z',
        },
      ],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    } as never);

    render(
      <MaterialHierarchyPage
        query="listas"
        segments={[
          'carreras',
          careerId,
          'planes',
          studyPlanId,
          'anios',
          '2',
          'materias',
          subjectId,
        ]}
      />,
    );

    expect(await screen.findByText('Guía de listas enlazadas')).toBeInTheDocument();
    expect(getMaterialDiscovery).toHaveBeenCalledWith({
      subjectId,
      search: 'listas',
      sort: 'RELEVANCE',
      page: 1,
      limit: 50,
    });
    expect(screen.getByRole('searchbox')).toHaveValue('listas');
    expect(screen.getByRole('link', { name: 'Borrar búsqueda' })).toHaveAttribute(
      'href',
      `/materiales/carreras/${careerId}/planes/${studyPlanId}/anios/2/materias/${subjectId}`,
    );
  });

  it('loads only the selected resource category file list', async () => {
    vi.mocked(getHierarchySubjects).mockResolvedValue(subjectContext);
    vi.mocked(getHierarchyFiles).mockResolvedValue({
      subject: { id: subjectId, name: 'Estructuras de Datos', code: 'INF-201' },
      resourceType: 'PARCIAL',
      files: [
        {
          id: 'material-2',
          title: 'Parcial 1',
          fileType: 'application/pdf',
          resourceType: 'PARCIAL',
          academicYear: 2026,
          createdAt: '2026-08-30T12:00:00.000Z',
        },
      ],
      hasMore: false,
    });

    render(
      <MaterialHierarchyPage
        query=""
        selectedFileId="material-2"
        segments={[
          'carreras',
          careerId,
          'planes',
          studyPlanId,
          'anios',
          '2',
          'materias',
          subjectId,
          'PARCIAL',
        ]}
      />,
    );

    expect(
      await screen.findByRole('dialog', { name: 'Vista previa: Parcial 1' }),
    ).toBeInTheDocument();
    expect(getHierarchyFiles).toHaveBeenCalledWith(subjectId, 'PARCIAL');
    expect(document.getElementById('material-file-material-2')).toHaveAttribute(
      'href',
      `/materiales/carreras/${careerId}/planes/${studyPlanId}/anios/2/materias/${subjectId}/PARCIAL?archivo=material-2`,
    );
    expect(
      screen.getByRole('navigation', { name: 'Ruta de navegación', hidden: true }),
    ).toHaveTextContent('Parciales');
  });
});
