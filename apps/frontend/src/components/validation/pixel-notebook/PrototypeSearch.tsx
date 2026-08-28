'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { filterValidationSuggestions } from './data';
import styles from './PrototypeShell.module.css';

type PrototypeSearchProps = {
  initialQuery?: string;
  compact?: boolean;
};

export function PrototypeSearch({ initialQuery = '', compact = false }: PrototypeSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const showSuggestions = !compact && isFocused && query.trim().length > 0;
  const suggestions = filterValidationSuggestions(query);
  const suggestionGroups = [
    { label: 'Materias', id: 'subjects', items: suggestions.subjects },
    { label: 'Recursos', id: 'resources', items: suggestions.resources },
  ].filter(({ items }) => items.length > 0);

  return (
    <div className={`${styles.searchWrap} ${compact ? styles.searchCompact : ''}`}>
      <form
        className={styles.searchForm}
        action="/validacion/pixel-notebook/resultados"
        method="get"
        role="search"
      >
        <Search aria-hidden="true" size={20} strokeWidth={1.8} />
        <label className={styles.visuallyHidden} htmlFor={compact ? 'results-query' : 'home-query'}>
          Buscar materia, parcial o apunte
        </label>
        <input
          id={compact ? 'results-query' : 'home-query'}
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
          placeholder="Buscá materia, parcial o apunte"
          autoComplete="off"
        />
        <button type="submit">Buscar</button>
      </form>

      {showSuggestions ? (
        <div
          className={styles.suggestionPanel}
          aria-label="Sugerencias de búsqueda"
          aria-live="polite"
        >
          {suggestionGroups.map(({ label, id, items }) => (
            <section key={id} aria-labelledby={`suggestion-${id}`}>
              <h2 id={`suggestion-${id}`}>{label}</h2>
              {items.map((item) => (
                <Link key={item.label} href={item.href}>
                  <span>{item.label}</span>
                  <small>{item.meta}</small>
                </Link>
              ))}
            </section>
          ))}
          {suggestionGroups.length === 0 ? (
            <p className={styles.suggestionEmpty}>
              No encontramos coincidencias. Probá con otro nombre o tipo de material.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
