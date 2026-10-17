import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AdminCareerDetail, BulkPreviewRow } from '@/lib/catalog-admin-client';

const catalog = vi.hoisted(() => ({
  career: vi.fn(),
  subjects: vi.fn(),
  setPlacement: vi.fn(),
  removePlacement: vi.fn(),
  createSubject: vi.fn(),
  codeProposal: vi.fn(),
  bulkPreview: vi.fn(),
  bulkApply: vi.fn(),
  readPlan: vi.fn(),
}));
vi.mock('@/lib/catalog-admin-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/catalog-admin-client')>()),
  catalogAdmin: catalog,
}));

import { CareerEditor } from './CareerEditor';

const detail: AdminCareerDetail = {
  id: 'c-lf',
  name: 'Licenciatura en Física',
  code: 'LF',
  status: 'DRAFT',
  planUrl: null,
  declarationCount: 0,
  faculty: {
    id: 'f-fce',
    name: 'Exactas',
    shortName: 'FCE',
    university: { id: 'u', name: 'UNSa', shortName: 'UNSa' },
  },
  placements: [
    { subjectId: 's-an', name: 'Análisis I', code: 'an', year: 1, semester: 1, credits: 8 },
    { subjectId: 's-lab', name: 'Laboratorio', code: 'lab', year: 1, semester: 0, credits: null },
    { subjectId: 's-mec', name: 'Mecánica', code: 'mec', year: 2, semester: 2, credits: null },
  ],
};

const row = (extra: Partial<BulkPreviewRow>): BulkPreviewRow => ({
  line: 1,
  year: 1,
  semester: 1,
  name: 'Química',
  credits: null,
  optativa: false,
  errors: [],
  action: 'new',
  subjectId: null,
  code: 'unsa-fce-quimica',
  placement: 'add',
  ...extra,
});

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  catalog.career.mockResolvedValue(detail);
  catalog.subjects.mockResolvedValue([
    { id: 's-an', name: 'Análisis I', code: 'an', materialCount: 2 },
    { id: 's-opt', name: 'Óptica', code: 'opt', materialCount: 0 },
  ]);
  catalog.setPlacement.mockResolvedValue({});
  catalog.removePlacement.mockResolvedValue(undefined);
  catalog.bulkApply.mockResolvedValue({ created: 1, added: 1, updated: 1 });
});

describe('CareerEditor', () => {
  it('groups the materias by año, anuales first', async () => {
    render(<CareerEditor careerId="c-lf" />);
    const year1 = await screen.findByRole('region', { name: '1.º año' });
    const names = within(year1)
      .getAllByRole('row')
      .slice(1)
      .map((r) => within(r).getAllByRole('cell')[0].textContent);
    expect(names).toEqual(['Laboratorio', 'Análisis I']);
    expect(within(year1).getByLabelText('Cuatrimestre de Laboratorio')).toHaveValue('0');
    expect(screen.getByRole('region', { name: '2.º año' })).toHaveTextContent('Mecánica');
  });

  it('adds a materia of the facultad', async () => {
    const user = userEvent.setup();
    render(<CareerEditor careerId="c-lf" />);
    await screen.findByRole('region', { name: '1.º año' });
    await user.click(screen.getByRole('button', { name: 'Agregar materia' }));
    await user.selectOptions(screen.getByLabelText('Materia'), 's-opt');
    await user.selectOptions(screen.getByLabelText('Año'), '2');
    await user.selectOptions(screen.getByLabelText('Cuatrimestre'), '0');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(catalog.setPlacement).toHaveBeenCalledWith('c-lf', 's-opt', {
      year: 2,
      semester: 0,
      credits: null,
    });
    await waitFor(() => expect(catalog.career).toHaveBeenCalledTimes(2));
  });

  it('edits and removes a placement', async () => {
    const user = userEvent.setup();
    render(<CareerEditor careerId="c-lf" />);
    const year2 = await screen.findByRole('region', { name: '2.º año' });
    await user.selectOptions(within(year2).getByLabelText('Año de Mecánica'), '3');
    expect(catalog.setPlacement).toHaveBeenCalledWith('c-lf', 's-mec', {
      year: 3,
      semester: 2,
      credits: null,
    });
    await user.click(within(year2).getByRole('button', { name: 'Quitar Mecánica' }));
    expect(catalog.removePlacement).toHaveBeenCalledWith('c-lf', 's-mec');
  });

  describe('optativas', () => {
    beforeEach(() => {
      catalog.career.mockResolvedValue({
        ...detail,
        placements: [
          ...detail.placements,
          {
            subjectId: 's-rob',
            name: 'Robótica',
            code: 'rob',
            year: null,
            semester: null,
            credits: 6,
          },
        ],
      });
    });

    it('lists optativas in their own group, after the años, without cuatrimestre', async () => {
      render(<CareerEditor careerId="c-lf" />);
      const optativas = await screen.findByRole('region', { name: 'Optativas' });
      expect(
        screen
          .getAllByRole('region')
          .map((r) => r.getAttribute('aria-labelledby'))
          .filter(Boolean),
      ).toEqual(['editor-anio-1', 'editor-anio-2', 'editor-optativas']);
      expect(within(optativas).getByLabelText('Año de Robótica')).toHaveValue('O');
      expect(within(optativas).queryByLabelText('Cuatrimestre de Robótica')).toBeNull();
    });

    it('moves a materia between an año and the optativas', async () => {
      const user = userEvent.setup();
      render(<CareerEditor careerId="c-lf" />);
      const optativas = await screen.findByRole('region', { name: 'Optativas' });
      await user.selectOptions(within(optativas).getByLabelText('Año de Robótica'), '4');
      expect(catalog.setPlacement).toHaveBeenCalledWith('c-lf', 's-rob', {
        year: 4,
        semester: 1,
        credits: 6,
      });
      const year2 = screen.getByRole('region', { name: '2.º año' });
      await user.selectOptions(within(year2).getByLabelText('Año de Mecánica'), 'O');
      expect(catalog.setPlacement).toHaveBeenCalledWith('c-lf', 's-mec', {
        optativa: true,
        credits: null,
      });
    });
  });

  it('adds a materia as an optativa', async () => {
    const user = userEvent.setup();
    render(<CareerEditor careerId="c-lf" />);
    await screen.findByRole('region', { name: '1.º año' });
    await user.click(screen.getByRole('button', { name: 'Agregar materia' }));
    await user.selectOptions(screen.getByLabelText('Materia'), 's-opt');
    await user.selectOptions(screen.getByLabelText('Año'), 'O');
    expect(screen.queryByLabelText('Cuatrimestre')).toBeNull();
    await user.type(screen.getByLabelText('Créditos (opcional)'), '4');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(catalog.setPlacement).toHaveBeenCalledWith('c-lf', 's-opt', {
      optativa: true,
      credits: 4,
    });
  });

  it('previews and applies optativa lines', async () => {
    const user = userEvent.setup();
    catalog.bulkPreview.mockResolvedValue([
      row({ line: 1, name: 'Robótica', year: null, semester: null, optativa: true, credits: 6 }),
    ]);
    render(<CareerEditor careerId="c-lf" />);
    await screen.findByRole('region', { name: '1.º año' });
    await user.click(screen.getByRole('button', { name: 'Carga masiva' }));
    await user.type(screen.getByLabelText(/Una materia por línea/), 'O;;Robótica;6');
    await user.click(screen.getByRole('button', { name: 'Vista previa' }));
    const preview = await screen.findByRole('table', { name: 'Vista previa' });
    expect(within(preview).getByText('Optativa')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirmar carga' }));
    expect(catalog.bulkApply).toHaveBeenCalledWith('c-lf', [
      { action: 'new', name: 'Robótica', code: 'unsa-fce-quimica', optativa: true, credits: 6 },
    ]);
  });

  describe('lectura del plan', () => {
    const withPlan = { ...detail, planUrl: 'https://exactas.unsa.edu.ar/lf.pdf' };
    const openBulk = async (user: ReturnType<typeof userEvent.setup>) => {
      await screen.findByRole('region', { name: '1.º año' });
      await user.click(screen.getByRole('button', { name: 'Carga masiva' }));
    };

    it('asks for the plan link when the carrera has none', async () => {
      const user = userEvent.setup();
      render(<CareerEditor careerId="c-lf" />);
      await openBulk(user);
      expect(screen.queryByRole('button', { name: 'Leer plan con IA' })).toBeNull();
      expect(screen.getByText(/agregá el link al plan oficial/i)).toBeInTheDocument();
    });

    it('is not offered for a published carrera', async () => {
      const user = userEvent.setup();
      catalog.career.mockResolvedValue({ ...withPlan, status: 'PUBLISHED' });
      render(<CareerEditor careerId="c-lf" />);
      await openBulk(user);
      expect(screen.queryByRole('button', { name: 'Leer plan con IA' })).toBeNull();
      expect(screen.queryByText(/agregá el link al plan oficial/i)).toBeNull();
    });

    it('fills the box with the lectura and shows its notices and sources', async () => {
      const user = userEvent.setup();
      catalog.career.mockResolvedValue(withPlan);
      let finish: (value: unknown) => void = () => {};
      catalog.readPlan.mockReturnValue(new Promise((resolve) => (finish = resolve)));
      render(<CareerEditor careerId="c-lf" />);
      await openBulk(user);
      await user.click(screen.getByRole('button', { name: 'Leer plan con IA' }));

      expect(catalog.readPlan).toHaveBeenCalledWith('c-lf');
      expect(screen.getByRole('button', { name: /Leyendo el plan/ })).toBeDisabled();
      finish({
        text: '1;1;Análisis I\nO;;Robótica',
        notices: ['Usé el plan 2023.'],
        sources: [{ url: 'https://exactas.unsa.edu.ar/lf.pdf', kind: 'pdf' }],
      });

      expect(await screen.findByText('Usé el plan 2023.')).toBeInTheDocument();
      expect(screen.getByLabelText(/Una materia por línea/)).toHaveValue(
        '1;1;Análisis I\nO;;Robótica',
      );
      expect(screen.getByRole('link', { name: /lf\.pdf/ })).toHaveAttribute(
        'href',
        'https://exactas.unsa.edu.ar/lf.pdf',
      );
      expect(screen.getByRole('button', { name: 'Leer plan con IA' })).toBeEnabled();
    });

    it('asks before replacing text already in the box', async () => {
      const user = userEvent.setup();
      catalog.career.mockResolvedValue(withPlan);
      catalog.readPlan.mockResolvedValue({ text: '1;1;Nueva', notices: [], sources: [] });
      render(<CareerEditor careerId="c-lf" />);
      await openBulk(user);
      await user.type(screen.getByLabelText(/Una materia por línea/), '2;1;Mía');
      await user.click(screen.getByRole('button', { name: 'Leer plan con IA' }));
      expect(catalog.readPlan).not.toHaveBeenCalled();
      await user.click(screen.getByRole('button', { name: 'Cancelar lectura' }));
      expect(screen.getByLabelText(/Una materia por línea/)).toHaveValue('2;1;Mía');

      await user.click(screen.getByRole('button', { name: 'Leer plan con IA' }));
      await user.click(screen.getByRole('button', { name: 'Leer y reemplazar' }));
      await waitFor(() =>
        expect(screen.getByLabelText(/Una materia por línea/)).toHaveValue('1;1;Nueva'),
      );
    });

    it('shows the error and keeps the text', async () => {
      const user = userEvent.setup();
      catalog.career.mockResolvedValue(withPlan);
      catalog.readPlan.mockRejectedValue({
        response: { data: { code: 'AI_QUOTA', message: 'Se agotó la cuota de la IA por ahora.' } },
      });
      render(<CareerEditor careerId="c-lf" />);
      await openBulk(user);
      await user.click(screen.getByRole('button', { name: 'Leer plan con IA' }));
      expect(await screen.findByText('Se agotó la cuota de la IA por ahora.')).toBeInTheDocument();
      expect(screen.getByLabelText(/Una materia por línea/)).toHaveValue('');
    });
  });

  it('previews a carga masiva, lets each row change, and applies it', async () => {
    const user = userEvent.setup();
    catalog.bulkPreview.mockResolvedValue([
      row({
        line: 1,
        name: 'Análisis I',
        action: 'reuse',
        subjectId: 's-an',
        code: 'an',
        placement: 'update',
        year: 1,
        semester: 2,
      }),
      row({ line: 2, name: 'Química', year: 1, semester: 0 }),
    ]);
    render(<CareerEditor careerId="c-lf" />);
    await screen.findByRole('region', { name: '1.º año' });
    await user.click(screen.getByRole('button', { name: 'Carga masiva' }));
    await user.type(
      screen.getByLabelText(/Una materia por línea/),
      '1;2;Análisis I{enter}1;A;Química',
    );
    await user.click(screen.getByRole('button', { name: 'Vista previa' }));

    const preview = await screen.findByRole('table', { name: 'Vista previa' });
    expect(within(preview).getByText('Se reutiliza')).toBeInTheDocument();
    expect(within(preview).getByDisplayValue('unsa-fce-quimica')).toBeInTheDocument();
    await user.clear(within(preview).getByLabelText('Código de la línea 2'));
    await user.type(within(preview).getByLabelText('Código de la línea 2'), 'quimica-gral');

    await user.click(screen.getByRole('button', { name: 'Confirmar carga' }));
    expect(catalog.bulkApply).toHaveBeenCalledWith('c-lf', [
      { action: 'reuse', subjectId: 's-an', year: 1, semester: 2, credits: null },
      { action: 'new', name: 'Química', code: 'quimica-gral', year: 1, semester: 0, credits: null },
    ]);
    expect(
      await screen.findByText('Listo: 1 materias nuevas, 1 agregadas, 1 actualizadas.'),
    ).toBeInTheDocument();
  });

  it('blocks confirmation while a row is invalid, until it is dropped', async () => {
    const user = userEvent.setup();
    catalog.bulkPreview.mockResolvedValue([
      row({ line: 1 }),
      row({
        line: 2,
        name: 'Física',
        action: 'invalid',
        errors: ['El año va de 1 a 10.'],
        code: null,
        placement: null,
      }),
    ]);
    render(<CareerEditor careerId="c-lf" />);
    await screen.findByRole('region', { name: '1.º año' });
    await user.click(screen.getByRole('button', { name: 'Carga masiva' }));
    await user.type(screen.getByLabelText(/Una materia por línea/), 'x');
    await user.click(screen.getByRole('button', { name: 'Vista previa' }));
    expect(await screen.findByText('El año va de 1 a 10.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar carga' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Quitar la línea 2' }));
    expect(screen.getByRole('button', { name: 'Confirmar carga' })).toBeEnabled();
  });

  it('gives a row switched from reuse to new its own code', async () => {
    const user = userEvent.setup();
    catalog.codeProposal.mockResolvedValue('unsa-fce-analisis-i-2');
    catalog.bulkPreview.mockResolvedValue([
      row({
        line: 1,
        name: 'Análisis I',
        action: 'reuse',
        subjectId: 's-an',
        code: 'an',
        placement: 'unchanged',
      }),
    ]);
    render(<CareerEditor careerId="c-lf" />);
    await screen.findByRole('region', { name: '1.º año' });
    await user.click(screen.getByRole('button', { name: 'Carga masiva' }));
    await user.type(screen.getByLabelText(/Una materia por línea/), 'x');
    await user.click(screen.getByRole('button', { name: 'Vista previa' }));
    await user.selectOptions(await screen.findByLabelText('Acción de la línea 1'), 'new');
    expect(await screen.findByDisplayValue('unsa-fce-analisis-i-2')).toBeInTheDocument();
    expect(catalog.codeProposal).toHaveBeenCalledWith('f-fce', 'Análisis I');

    await user.selectOptions(screen.getByLabelText('Acción de la línea 1'), 'reuse');
    await user.selectOptions(screen.getByLabelText('Acción de la línea 1'), 'new');
    await user.click(screen.getByRole('button', { name: 'Confirmar carga' }));
    expect(catalog.bulkApply).toHaveBeenCalledWith('c-lf', [
      {
        action: 'new',
        name: 'Análisis I',
        code: 'unsa-fce-analisis-i-2',
        year: 1,
        semester: 1,
        credits: null,
      },
    ]);
  });

  it('reuses the materia it created when a retry follows a failed placement', async () => {
    const user = userEvent.setup();
    catalog.createSubject.mockResolvedValue({
      id: 's-new',
      name: 'Óptica II',
      code: 'opt-2',
      materialCount: 0,
    });
    catalog.setPlacement.mockRejectedValueOnce(new Error('network')).mockResolvedValue({});
    render(<CareerEditor careerId="c-lf" />);
    await screen.findByRole('region', { name: '1.º año' });
    await user.click(screen.getByRole('button', { name: 'Agregar materia' }));
    await user.selectOptions(screen.getByLabelText('Materia'), '__new');
    await user.type(screen.getByLabelText('Nombre'), 'Óptica II');
    await user.type(screen.getByLabelText('Código'), 'opt-2');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Agregar' }));
    await waitFor(() => expect(catalog.setPlacement).toHaveBeenCalledTimes(2));
    expect(catalog.createSubject).toHaveBeenCalledTimes(1);
    expect(catalog.setPlacement).toHaveBeenLastCalledWith('c-lf', 's-new', {
      year: 1,
      semester: 1,
      credits: null,
    });
  });
});
