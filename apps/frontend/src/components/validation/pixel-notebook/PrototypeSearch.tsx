'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { useState } from 'react';
import styles from './PrototypeShell.module.css';

type PrototypeSearchProps = {
  initialQuery?: string;
  compact?: boolean;
};

const suggestions = {
  Materias: [
    { label: 'Algoritmos y Estructuras de Datos', meta: 'S2-14 · 2.º año' },
    { label: 'Análisis Matemático II', meta: 'S2-08 · 2.º año' },
  ],
  Recursos: [
    { label: 'Parcial 1 resuelto: complejidad, listas y pilas', meta: 'Parcial · 2025' },
    { label: 'Guía práctica de listas enlazadas', meta: 'Apunte · 2024' },
  ],
};

export function PrototypeSearch({ initialQuery = '', compact = false }: PrototypeSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const showSuggestions = !compact && isFocused && query.trim().length > 0;

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
        <div className={styles.suggestionPanel} aria-label="Sugerencias de búsqueda">
          {Object.entries(suggestions).map(([group, items]) => (
            <section key={group} aria-labelledby={`suggestion-${group}`}>
              <h2 id={`suggestion-${group}`}>{group}</h2>
              {items.map((item) => (
                <Link key={item.label} href="/validacion/pixel-notebook/resultados?q=algoritmos">
                  <span>{item.label}</span>
                  <small>{item.meta}</small>
                </Link>
              ))}
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
