'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { ChevronDown, X } from 'lucide-react';
import Link from 'next/link';
import { forwardRef, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { cn } from '@/components/ui/shadcn/utils';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types/auth';

import { accountMenuItems, defaultAvatarFor } from './account';

type AccountMenuProps = {
  user: User;
  /** Desktop opens a dropdown; mobile opens a bottom sheet (see design.md, decision 6). */
  variant: 'desktop' | 'mobile';
};

type AvatarPillProps = React.ComponentProps<'button'> & AccountMenuProps;

const AvatarPill = forwardRef<HTMLButtonElement, AvatarPillProps>(function AvatarPill(
  { className, user, variant, ...props },
  ref,
) {
  const name = user.displayName ?? user.username;

  return (
    <button
      aria-label={`${name}, abrir menú de cuenta`}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-primary bg-card p-1 font-extrabold text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        variant === 'desktop' ? 'pr-3 text-[0.906rem]' : 'text-sm',
        className,
      )}
      ref={ref}
      type="button"
      {...props}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 34px avatar from an arbitrary host or /avatars */}
      <img
        alt=""
        className="size-[34px] rounded-full border-[1.5px] border-foreground object-cover"
        height={34}
        src={user.avatarUrl ?? defaultAvatarFor(user.id)}
        width={34}
      />
      {variant === 'desktop' ? <span className="max-w-28 truncate">{name}</span> : null}
      {variant === 'desktop' ? <ChevronDown aria-hidden="true" className="size-3.5" /> : null}
    </button>
  );
});

export function AccountMenu({ user, variant }: AccountMenuProps) {
  const logout = useAuthStore((state) => state.logout);
  const [open, setOpen] = useState(false);
  const items = accountMenuItems(user);
  const links = items.filter((item) => item.href);
  const signOut = items.find((item) => item.action === 'logout');

  const handleSignOut = async () => {
    setOpen(false);
    await logout();
  };

  if (variant === 'desktop') {
    return (
      <DropdownMenu onOpenChange={setOpen} open={open}>
        <DropdownMenuTrigger asChild>
          <AvatarPill user={user} variant={variant} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" aria-label="Tu cuenta">
          {links.map(({ href, icon: Icon, id, label }) => (
            <DropdownMenuItem asChild key={id}>
              <Link href={href!}>
                <Icon aria-hidden="true" />
                {label}
              </Link>
            </DropdownMenuItem>
          ))}
          {signOut ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleSignOut}>
                <signOut.icon aria-hidden="true" />
                {signOut.label}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const itemClassName =
    'flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-[0.9375rem] font-semibold text-foreground outline-none hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring [&_svg]:size-5 [&_svg]:shrink-0';

  return (
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <Dialog.Trigger asChild>
        <AvatarPill user={user} variant={variant} />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/35" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 grid max-h-[85dvh] gap-2 overflow-y-auto rounded-t-2xl border-[1.5px] border-b-0 border-border bg-card px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] font-sans text-card-foreground outline-none">
          <header className="flex items-center justify-between gap-3">
            <Dialog.Title className="text-lg font-extrabold tracking-[-0.03em]">
              Tu cuenta
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Accesos de tu cuenta de DevsProject.
            </Dialog.Description>
            <Dialog.Close
              aria-label="Cerrar"
              className="inline-grid size-11 place-items-center rounded-xl outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              <X aria-hidden="true" className="size-5" />
            </Dialog.Close>
          </header>
          <nav aria-label="Tu cuenta">
            <ul className="grid gap-1">
              {links.map(({ href, icon: Icon, id, label }) => (
                <li key={id}>
                  <Link className={itemClassName} href={href!} onClick={() => setOpen(false)}>
                    <Icon aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {signOut ? (
            <div className="border-t border-line pt-2">
              <button className={itemClassName} onClick={handleSignOut} type="button">
                <signOut.icon aria-hidden="true" />
                {signOut.label}
              </button>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
