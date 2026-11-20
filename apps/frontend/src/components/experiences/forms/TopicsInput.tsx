'use client';

import { Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getSubjectExamTopics } from '@/lib/experiences-client';

export const MAX_TOPICS = 10;
export const MIN_TOPIC_LENGTH = 2;
export const MAX_TOPIC_LENGTH = 60;
const MAX_SUGGESTIONS = 8;

/** Trimmed, inner whitespace collapsed, capped at 60 characters, as the API stores it. */
export function normalizeTopic(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, MAX_TOPIC_LENGTH).trim();
}

/** Two topics are the same when they differ only in case or spacing. */
export function topicKey(topic: string): string {
  return normalizeTopic(topic).toLocaleLowerCase('es');
}

/**
 * «Temas que tomaron» (openspec academic-community/experiences «Topic
 * suggestions»): free-text chips added with Enter, duplicates ignored, at most
 * ten, plus the materia's topics shared by two or more public finales under
 * «Los cargaron otros en esta materia:», leaving out those already added.
 */
export function TopicsInput({
  describedBy,
  id,
  onChange,
  subjectCode,
  value,
}: {
  /** Extra description ids for the text input (a field error, for example). */
  describedBy?: string;
  id: string;
  onChange: (topics: string[]) => void;
  /** Public code of the materia; without it no suggestions are requested. */
  subjectCode: string | null;
  value: readonly string[];
}) {
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!subjectCode) return;
    let current = true;
    getSubjectExamTopics(subjectCode)
      .then(({ topics }) => {
        if (current) setSuggestions(topics.map(({ topic }) => normalizeTopic(topic)));
      })
      .catch(() => {
        if (current) setSuggestions([]);
      });
    return () => {
      current = false;
    };
  }, [subjectCode]);

  const added = new Set(value.map(topicKey));
  const typedKey = topicKey(draft);
  const available = suggestions
    .filter((topic) => !added.has(topicKey(topic)))
    .filter((topic) => !typedKey || topicKey(topic).includes(typedKey))
    .slice(0, MAX_SUGGESTIONS);

  const add = (raw: string) => {
    const topic = normalizeTopic(raw);
    if (topic.length < MIN_TOPIC_LENGTH) {
      setMessage('Cada tema necesita al menos 2 caracteres.');
      return false;
    }
    if (added.has(topicKey(topic))) {
      setMessage(null);
      return true;
    }
    if (value.length >= MAX_TOPICS) {
      setMessage('Podés cargar hasta 10 temas.');
      return false;
    }
    setMessage(null);
    onChange([...value, topic]);
    return true;
  };

  const remove = (topic: string) => {
    setMessage(null);
    onChange(value.filter((current) => current !== topic));
  };

  const messageId = `${id}-message`;
  const suggestionsLabelId = `${id}-suggestions`;
  const inputDescription = [message ? messageId : null, describedBy].filter(Boolean).join(' ');

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-xl border-2 border-foreground bg-card px-3 py-2.5 focus-within:ring-[3px] focus-within:ring-ring">
        <ul aria-label="Temas agregados" className="flex min-w-0 flex-wrap gap-2 empty:hidden">
          {value.map((topic) => (
            <li
              className="inline-flex max-w-full items-center gap-1.5 rounded-lg border-[1.5px] border-foreground bg-secondary py-1 pr-1 pl-2.5 font-sans text-[0.8125rem] font-bold text-secondary-foreground"
              key={topic}
            >
              <span className="min-w-0 break-words">{topic}</span>
              <button
                aria-label={`Quitar ${topic}`}
                className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
                onClick={() => remove(topic)}
                type="button"
              >
                <X aria-hidden="true" className="size-3.5" strokeWidth={2.6} />
              </button>
            </li>
          ))}
        </ul>
        <input
          aria-describedby={inputDescription || undefined}
          aria-label="Agregar un tema"
          className="min-h-8 min-w-[12rem] flex-1 bg-transparent font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground"
          id={id}
          maxLength={MAX_TOPIC_LENGTH * 2}
          onChange={(event) => {
            setDraft(event.target.value);
            if (message) setMessage(null);
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
            event.preventDefault();
            if (!draft.trim()) return;
            if (add(draft)) setDraft('');
          }}
          placeholder="Escribí un tema y presioná Enter…"
          type="text"
          value={draft}
        />
      </div>
      {message ? (
        <p
          aria-live="polite"
          className="mt-2 font-sans text-sm font-bold text-destructive-ink"
          id={messageId}
        >
          {message}
        </p>
      ) : null}
      {available.length > 0 ? (
        <div
          aria-labelledby={suggestionsLabelId}
          className="mt-2.5 flex flex-wrap items-center gap-2"
          role="group"
        >
          <span
            className="font-sans text-xs font-bold text-muted-foreground"
            id={suggestionsLabelId}
          >
            Los cargaron otros en esta materia:
          </span>
          {available.map((topic) => (
            <button
              aria-label={`Agregar ${topic}`}
              className="inline-flex min-h-8 items-center gap-1 rounded-lg border-[1.5px] border-dashed border-border bg-card px-2.5 font-sans text-[0.8125rem] font-bold text-secondary-foreground hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
              key={topic}
              onClick={() => {
                add(topic);
                setDraft('');
              }}
              type="button"
            >
              <Plus aria-hidden="true" className="size-3.5" strokeWidth={2.6} />
              {topic}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
