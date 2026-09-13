import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getHierarchyCareers,
  getHierarchyFiles,
  getHierarchySubjects,
} from '@/lib/discovery-hierarchy-client';
import { getMaterialDiscovery } from '@/lib/discovery-client';
import type { MaterialPreview } from '@/types/material';
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

function pdfPreview(materialId: string): MaterialPreview {
  const downloadUrl = `http://localhost:3001/api/v1/materials/${materialId}/download`;
  return {
    capability: 'PDF',
    url: `/uploads/materials/${materialId}.pdf`,
    canPreview: true,
    downloadUrl,
    fallback: { reason: 'PREVIEW_FAILED', downloadUrl },
  };
}

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
          helpfulCount: 3,
          starSummary: { average: '4.50', count: 2 },
          preview: pdfPreview('material-2'),
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

    // Evidence comes from the hierarchy rows themselves: no second `/materials` request.
    expect(getMaterialDiscovery).not.toHaveBeenCalled();
    const row = document.getElementById('material-file-material-2')!.closest('article')!;
    expect(row).toHaveTextContent('Parcial · APPLICATION/PDF');
    expect(row).toHaveTextContent('Ciclo lectivo: 2026 · Profesor: No informado');
    expect(row).toHaveTextContent('3 dijeron “Me sirvió”');
    expect(row).toHaveTextContent('4,5 ★ · 2');
    expect(
      row.querySelector('[aria-label="4,5 de 5 estrellas a partir de 2 valoraciones"]'),
    ).not.toBeNull();
    expect(row).toHaveTextContent('Vista previa');
    expect(row).not.toHaveTextContent('Revisado');
  });

  it('keeps file rows usable and honest when a row omits community evidence', async () => {
    vi.mocked(getHierarchySubjects).mockResolvedValue(subjectContext);
    vi.mocked(getHierarchyFiles).mockResolvedValue({
      subject: { id: subjectId, name: 'Estructuras de Datos', code: 'INF-201' },
      resourceType: 'APUNTE',
      // A partial row (e.g. an older payload) must degrade to `No informado`, not crash.
      files: [
        {
          id: 'material-3',
          title: 'Apunte de árboles',
          fileType: 'pdf',
          resourceType: 'APUNTE',
          academicYear: null,
          createdAt: '2026-08-30T12:00:00.000Z',
        },
      ] as never,
      hasMore: false,
    });

    render(
      <MaterialHierarchyPage
        query=""
        segments={[
          'carreras',
          careerId,
          'planes',
          studyPlanId,
          'anios',
          '2',
          'materias',
          subjectId,
          'APUNTE',
        ]}
      />,
    );

    const action = await screen.findByRole('link', { name: 'Vista previa de Apunte de árboles' });
    expect(action).toHaveAttribute(
      'href',
      `/materiales/carreras/${careerId}/planes/${studyPlanId}/anios/2/materias/${subjectId}/APUNTE?archivo=material-3`,
    );
    expect(action).toHaveAttribute('id', 'material-file-material-3');
    const row = action.closest('article')!;
    expect(row).toHaveTextContent('Ciclo lectivo: No informado · Profesor: No informado');
    expect(row).toHaveTextContent('“Me sirvió”: No informado');
    expect(screen.getByLabelText('Valoraciones: No informado')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Vista previa/ })).toHaveLength(1);
    expect(row).not.toHaveTextContent('Revisado');
    expect(getMaterialDiscovery).not.toHaveBeenCalled();
  });

  it('shows each row its own evidence beyond one `/materials` page of 50', async () => {
    const fileCount = 60;
    vi.mocked(getHierarchySubjects).mockResolvedValue(subjectContext);
    vi.mocked(getHierarchyFiles).mockResolvedValue({
      subject: { id: subjectId, name: 'Estructuras de Datos', code: 'INF-201' },
      resourceType: 'RESUMEN',
      files: Array.from({ length: fileCount }, (_, index) => {
        const n = index + 1;
        return {
          id: `material-bulk-${n}`,
          title: `Resumen ${n}`,
          fileType: 'pdf',
          resourceType: 'RESUMEN' as const,
          academicYear: 2026,
          createdAt: '2026-08-30T12:00:00.000Z',
          helpfulCount: n,
          // The API serialises averages as strings; unrated rows come back as "0".
          starSummary: n % 2 === 0 ? { average: '0', count: 0 } : { average: '4.00', count: n },
          preview: pdfPreview(`material-bulk-${n}`),
        };
      }),
      hasMore: false,
    });

    render(
      <MaterialHierarchyPage
        query=""
        segments={[
          'carreras',
          careerId,
          'planes',
          studyPlanId,
          'anios',
          '2',
          'materias',
          subjectId,
          'RESUMEN',
        ]}
      />,
    );

    await screen.findByRole('link', { name: `Vista previa de Resumen ${fileCount}` });
    const rows = document.querySelectorAll('[data-slot="material-file-row"]');
    expect(rows).toHaveLength(fileCount);
    rows.forEach((row, index) => {
      const n = index + 1;
      expect(row).toHaveTextContent(`Resumen ${n}`);
      expect(row).toHaveTextContent(`${n} dijeron “Me sirvió”`);
      expect(row).toHaveTextContent(n % 2 === 0 ? 'Sin valoraciones' : `4,0 ★ · ${n}`);
      expect(row).not.toHaveTextContent('“Me sirvió”: No informado');
      expect(row).not.toHaveTextContent('Valoraciones: No informado');
    });
    expect(getMaterialDiscovery).not.toHaveBeenCalled();
  });
});
