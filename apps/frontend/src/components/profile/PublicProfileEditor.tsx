'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { avatarSrc } from '@/components/layout/account';
import {
  ACCENT_COLORS,
  backgroundClass,
  bannerSrc,
  frameClass,
  profileStyles,
} from '@/components/public-profile/cosmetics';
import { Button, ErrorState, LoadingState } from '@/components/ui/shadcn';
import { getApiError } from '@/lib/apiHelpers';
import {
  getMyProfileCustomization,
  getProfileContributions,
  saveMyProfileCustomization,
  type ContributionItem,
  type MyProfileCustomization,
  type ProfileChoices,
  type ProfileOption,
  type ProfileOptionKind,
} from '@/lib/profile-client';

type EditorUser = { id: string; username: string; avatarUrl: string | null };

type Props = {
  user: EditorUser;
  /** Called after a save, so the shell can show the new avatar. */
  onSaved: () => void;
};

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      data: MyProfileCustomization;
      contributions: ContributionItem[];
      page: number;
      hasMore: boolean;
    };

const GROUPS: { kind: ProfileOptionKind; field: keyof ProfileChoices; legend: string }[] = [
  { kind: 'cat', field: 'avatarCat', legend: 'Avatar' },
  { kind: 'accent', field: 'accent', legend: 'Color de acento' },
  { kind: 'background', field: 'background', legend: 'Fondo' },
  { kind: 'frame', field: 'frame', legend: 'Marco' },
  { kind: 'banner', field: 'banner', legend: 'Banner' },
  { kind: 'theme', field: 'theme', legend: 'Tema' },
];

const TYPE_LABEL: Record<ContributionItem['type'], string> = {
  MATERIAL: 'Material',
  COURSE_REVIEW: 'Reseña',
  EXAM_EXPERIENCE: 'Experiencia de final',
};

const pinKey = (pin: { type: string; id: string }) => `${pin.type}:${pin.id}`;

/** Toggles `value` in an ordered list, keeping the order in which it was chosen. */
const toggle = <T,>(list: T[], value: T, same: (a: T, b: T) => boolean) =>
  list.some((item) => same(item, value))
    ? list.filter((item) => !same(item, value))
    : [...list, value];

/**
 * Mi perfil → «Perfil público» (openspec reputation/profile-customization): the
 * predefined options the student has unlocked, the título, insignias
 * destacadas, aportes fijados and the «Mostrar mi nivel e insignias» switch.
 */
export function PublicProfileEditor({ user, onSaved }: Props) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [choices, setChoices] = useState<ProfileChoices | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getMyProfileCustomization(), getProfileContributions(user.username, 1)])
      .then(([data, page]) => {
        if (!active) return;
        // Pinned items older than the first page still need to be listed.
        const seen = new Set(page.items.map(pinKey));
        const contributions = [
          ...data.pinnedItems.filter((item) => !seen.has(pinKey(item))),
          ...page.items,
        ];
        setState({
          status: 'ready',
          data,
          contributions,
          page: page.page,
          hasMore: page.hasMore,
        });
        setChoices(data.choices);
      })
      .catch((error: unknown) => {
        if (active) setState({ status: 'error', message: getApiError(error) });
      });
    return () => {
      active = false;
    };
  }, [user.username]);

  const optionsByKind = useMemo(() => {
    const map = new Map<ProfileOptionKind, ProfileOption[]>();
    if (state.status !== 'ready') return map;
    for (const option of state.data.options) {
      map.set(option.kind, [...(map.get(option.kind) ?? []), option]);
    }
    return map;
  }, [state]);

  if (state.status === 'error') {
    return <ErrorState description={state.message} heading="No pudimos cargar tu perfil público" />;
  }
  if (state.status === 'loading' || !choices) {
    return <LoadingState heading="Cargando tu perfil público" />;
  }

  const { limits, eligibleBadges } = state.data;
  const update = (patch: Partial<ProfileChoices>) => {
    setSaved(false);
    setChoices((current) => (current ? { ...current, ...patch } : current));
  };

  async function save() {
    if (!choices) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const data = await saveMyProfileCustomization(choices);
      setState((current) => (current.status === 'ready' ? { ...current, data } : current));
      setChoices(data.choices);
      setSaved(true);
      onSaved();
    } catch (error) {
      setSaveError(getApiError(error));
    } finally {
      setSaving(false);
    }
  }

  /** Older contributions, so any of them can be pinned. */
  async function loadMoreContributions() {
    if (state.status !== 'ready') return;
    setLoadingMore(true);
    try {
      const next = await getProfileContributions(user.username, state.page + 1);
      setState((current) => {
        if (current.status !== 'ready') return current;
        const seen = new Set(current.contributions.map(pinKey));
        return {
          ...current,
          contributions: [
            ...current.contributions,
            ...next.items.filter((item) => !seen.has(pinKey(item))),
          ],
          page: next.page,
          hasMore: next.hasMore,
        };
      });
    } catch (error) {
      setSaveError(getApiError(error));
    } finally {
      setLoadingMore(false);
    }
  }

  const noneLabel = (kind: ProfileOptionKind) => {
    if (kind !== 'cat') return 'Ninguno';
    return user.avatarUrl ? 'Mi foto' : 'Gato asignado';
  };

  return (
    <section
      aria-labelledby="perfil-publico-heading"
      className="grid gap-5 font-sans"
      id="perfil-publico"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <h2 className="text-2xl font-extrabold tracking-[-0.03em]" id="perfil-publico-heading">
            Perfil público
          </h2>
          <p className="text-sm text-muted-foreground">
            Lo que ve cualquiera en tu perfil. Nada de esto aparece en tus aportes.
          </p>
        </div>
        <Link
          className="text-sm font-bold text-link underline-offset-4 hover:underline"
          href={`/usuarios/${encodeURIComponent(user.username)}`}
        >
          Ver mi perfil público
        </Link>
      </div>

      <div className="flex min-h-11 items-center justify-between gap-4 rounded-xl border-[1.5px] border-border bg-card p-4 text-sm">
        <div>
          <label className="block font-extrabold" htmlFor="perfil-mostrar-nivel">
            Mostrar mi nivel e insignias
          </label>
          <p className="text-muted-foreground" id="perfil-mostrar-nivel-ayuda">
            Si lo apagás, tu perfil no muestra tu nivel, tus insignias ni tu título.
          </p>
        </div>
        <input
          aria-describedby="perfil-mostrar-nivel-ayuda"
          checked={choices.showLevelAndBadges}
          className="size-5 accent-[var(--primary)]"
          id="perfil-mostrar-nivel"
          onChange={(event) => update({ showLevelAndBadges: event.target.checked })}
          role="switch"
          type="checkbox"
        />
      </div>

      {GROUPS.map(({ kind, field, legend }) => {
        const options = optionsByKind.get(kind) ?? [];
        const current = choices[field] as string | null;
        return (
          <fieldset className="grid gap-3 rounded-xl border-[1.5px] border-border p-4" key={kind}>
            <legend className="px-1 text-sm font-extrabold">{legend}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <OptionTile
                checked={current === null}
                label={noneLabel(kind)}
                name={field}
                onChange={() => update({ [field]: null })}
                preview={
                  kind === 'cat' ? (
                    <CatPreview src={avatarSrc({ ...user, avatarCat: null })} />
                  ) : null
                }
              />
              {options.map((option) => (
                <OptionTile
                  checked={current === option.id}
                  disabled={!option.unlocked}
                  key={option.id}
                  label={option.label}
                  lockLabel={option.unlocked ? undefined : option.unlockLabel}
                  name={field}
                  onChange={() => update({ [field]: option.id })}
                  preview={<OptionPreview kind={kind} option={option} userId={user.id} />}
                />
              ))}
            </div>
          </fieldset>
        );
      })}

      <div className="grid gap-2 rounded-xl border-[1.5px] border-border p-4 text-sm">
        <label className="font-extrabold" htmlFor="perfil-titulo">
          Título
        </label>
        <select
          className="min-h-11 w-full border border-input bg-background px-3 text-sm"
          disabled={!limits.titleUnlocked}
          id="perfil-titulo"
          onChange={(event) => update({ titleBadge: event.target.value || null })}
          value={choices.titleBadge ?? ''}
        >
          <option value="">Ninguno</option>
          {eligibleBadges.map((badge) => (
            <option key={badge.slug} value={badge.slug}>
              {badge.name}
            </option>
          ))}
        </select>
        {!limits.titleUnlocked ? (
          <p className="text-muted-foreground">El título se desbloquea en el nivel 6.</p>
        ) : null}
      </div>

      <fieldset className="grid gap-2 rounded-xl border-[1.5px] border-border p-4 text-sm">
        <legend className="px-1 font-extrabold">Insignias destacadas</legend>
        <p className="text-muted-foreground">
          Elegí hasta {limits.featured}, en el orden en que querés mostrarlas.
        </p>
        {eligibleBadges.length === 0 ? (
          <p className="text-muted-foreground">Todavía no tenés insignias para destacar.</p>
        ) : (
          eligibleBadges.map((badge) => {
            const position = choices.featuredBadges.indexOf(badge.slug);
            const full = choices.featuredBadges.length >= limits.featured;
            return (
              <label className="flex min-h-11 items-center gap-3" key={badge.slug}>
                <input
                  checked={position >= 0}
                  disabled={position < 0 && full}
                  onChange={() =>
                    update({
                      featuredBadges: toggle(choices.featuredBadges, badge.slug, (a, b) => a === b),
                    })
                  }
                  type="checkbox"
                />
                <span>
                  {badge.name}
                  {position >= 0 ? (
                    <span className="ml-2 text-muted-foreground">#{position + 1}</span>
                  ) : null}
                </span>
              </label>
            );
          })
        )}
      </fieldset>

      <fieldset className="grid gap-2 rounded-xl border-[1.5px] border-border p-4 text-sm">
        <legend className="px-1 font-extrabold">Aportes fijados</legend>
        {limits.pins === 0 ? (
          <p className="text-muted-foreground">Fijar aportes se desbloquea en el nivel 2.</p>
        ) : (
          <p className="text-muted-foreground">
            Podés fijar hasta {limits.pins} {limits.pins === 1 ? 'aporte' : 'aportes'}. Solo
            aparecen tus aportes publicados con tu nombre.
          </p>
        )}
        {state.contributions.length === 0 ? (
          <p className="text-muted-foreground">
            Todavía no tenés aportes publicados con tu nombre.
          </p>
        ) : (
          state.contributions.map((item) => {
            const position = choices.pinned.findIndex((pin) => pinKey(pin) === pinKey(item));
            const full = choices.pinned.length >= limits.pins;
            return (
              <label className="flex min-h-11 items-center gap-3" key={pinKey(item)}>
                <input
                  checked={position >= 0}
                  disabled={position < 0 && full}
                  onChange={() =>
                    update({
                      pinned: toggle(
                        choices.pinned,
                        { type: item.type, id: item.id },
                        (a, b) => pinKey(a) === pinKey(b),
                      ),
                    })
                  }
                  type="checkbox"
                />
                <span>
                  {item.title}
                  <span className="text-muted-foreground"> · {TYPE_LABEL[item.type]}</span>
                </span>
              </label>
            );
          })
        )}
        {state.hasMore ? (
          <div>
            <Button disabled={loadingMore} onClick={loadMoreContributions} variant="outline">
              Ver más aportes
            </Button>
          </div>
        ) : null}
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={saving} onClick={save}>
          Guardar perfil público
        </Button>
        {saved ? (
          <p className="text-sm font-semibold text-success-ink" role="status">
            Guardamos tu perfil público.
          </p>
        ) : null}
      </div>
      {saveError ? (
        <p className="text-sm font-semibold text-destructive-ink" role="alert">
          {saveError}
        </p>
      ) : null}
    </section>
  );
}

function OptionTile({
  name,
  label,
  checked,
  disabled = false,
  lockLabel,
  preview,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  lockLabel?: string;
  preview: React.ReactNode;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex min-h-11 cursor-pointer flex-col items-center gap-2 rounded-lg border-[1.5px] p-2 text-center text-xs font-semibold has-[:checked]:border-primary has-[:checked]:bg-secondary has-[:checked]:text-link has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring ${
        disabled
          ? 'cursor-not-allowed border-dashed border-border opacity-60'
          : 'border-border bg-card'
      }`}
    >
      <input
        aria-label={lockLabel ? `${label} (se desbloquea con ${lockLabel})` : label}
        checked={checked}
        className="sr-only"
        disabled={disabled}
        name={name}
        onChange={onChange}
        type="radio"
      />
      {preview}
      <span aria-hidden="true">{label}</span>
      {lockLabel ? <span className="text-muted-foreground">{lockLabel}</span> : null}
    </label>
  );
}

function CatPreview({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small local avatar preview
    <img alt="" className="size-12 rounded-full object-cover" height={48} src={src} width={48} />
  );
}

function OptionPreview({
  kind,
  option,
  userId,
}: {
  kind: ProfileOptionKind;
  option: ProfileOption;
  userId: string;
}) {
  if (kind === 'cat') {
    return <CatPreview src={avatarSrc({ id: userId, avatarUrl: null, avatarCat: option.id })} />;
  }
  if (kind === 'accent') {
    return (
      <span
        aria-hidden="true"
        className="size-8 rounded-full border-[1.5px] border-foreground"
        style={{ background: ACCENT_COLORS[option.id] }}
      />
    );
  }
  if (kind === 'background') {
    return (
      <span
        aria-hidden="true"
        className={`h-8 w-full rounded border border-border bg-background ${backgroundClass(option.id)}`}
      />
    );
  }
  if (kind === 'frame') {
    return (
      <span
        aria-hidden="true"
        className={`my-1 size-7 rounded-full bg-secondary ${profileStyles.avatar} ${frameClass(option.id)}`}
      />
    );
  }
  if (kind === 'theme') {
    return <span aria-hidden="true" className="h-8 w-full rounded bg-foreground" />;
  }
  if (kind === 'banner') {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- local banner thumbnail
      <img
        alt=""
        className="h-8 w-full rounded object-cover"
        height={32}
        src={bannerSrc(option.id)}
        width={96}
      />
    );
  }
  return null;
}
