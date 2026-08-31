'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { Button } from './button';
import { cn } from './utils';

export type FilterSheetProps = {
  applyLabel?: string;
  children: React.ReactNode;
  clearLabel?: string;
  description?: React.ReactNode;
  onApply: () => void;
  onClear: () => void;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  title: React.ReactNode;
  trigger: React.ReactElement;
};

/**
 * A mobile-first filter composition. Radix Dialog owns modal focus behavior;
 * this component owns the Spanish labels, filter actions, and Notebook styling.
 */
export function FilterSheet({
  applyLabel = 'Aplicar filtros',
  children,
  clearLabel = 'Limpiar filtros',
  description = 'Ajustá los filtros para encontrar el material que necesitás.',
  onApply,
  onClear,
  onOpenChange,
  open,
  title,
  trigger,
}: FilterSheetProps) {
  return (
    <Dialog.Root modal onOpenChange={onOpenChange} open={open}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/35 backdrop-blur-[1px]" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-50 grid max-h-[min(85dvh,48rem)] grid-rows-[auto_minmax(0,1fr)_auto] border border-border bg-card text-card-foreground shadow-surface outline-none lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-full lg:max-w-lg"
          data-slot="filter-sheet"
        >
          <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-4">
            <div className="grid gap-1">
              <Dialog.Title className="font-serif text-2xl font-bold text-card-foreground">
                {title}
              </Dialog.Title>
              <Dialog.Description className="font-sans text-sm text-muted-foreground">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button aria-label="Cerrar filtros" size="icon" variant="ghost">
                <X aria-hidden="true" className="size-5" />
              </Button>
            </Dialog.Close>
          </header>
          <div className="min-h-0 overflow-y-auto px-4 py-5">{children}</div>
          <footer className="grid grid-cols-2 gap-3 border-t border-border bg-background p-4">
            <Button onClick={onClear} variant="outline">
              {clearLabel}
            </Button>
            <Dialog.Close asChild>
              <Button onClick={onApply}>{applyLabel}</Button>
            </Dialog.Close>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export type FilterSheetFieldSetProps = Omit<React.ComponentProps<'fieldset'>, 'children'> & {
  children: React.ReactNode;
  legend: React.ReactNode;
};

export function FilterSheetFieldSet({
  children,
  className,
  legend,
  ...props
}: FilterSheetFieldSetProps) {
  return (
    <fieldset
      className={cn('grid gap-3 border-b border-border pb-5 last:border-b-0 last:pb-0', className)}
      data-slot="filter-sheet-fieldset"
      {...props}
    >
      <legend className="font-sans text-sm font-bold text-foreground">{legend}</legend>
      <div className="grid gap-3">{children}</div>
    </fieldset>
  );
}
