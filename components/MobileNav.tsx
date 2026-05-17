'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Link {
  href: string;
  label: string;
}

interface Props {
  links: Link[];
  isAdmin?: boolean;
  userEmail?: string;
  signOutAction: () => Promise<void>;
}

export function MobileNav({ links, isAdmin, userEmail, signOutAction }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        aria-label="Menú"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-md border border-line"
      >
        <span className="block w-5 relative">
          <span
            className={
              'block h-0.5 bg-ink transition-transform ' +
              (open ? 'translate-y-1 rotate-45' : '')
            }
          />
          <span
            className={'block h-0.5 bg-ink mt-1 transition-opacity ' + (open ? 'opacity-0' : '')}
          />
          <span
            className={
              'block h-0.5 bg-ink mt-1 transition-transform ' +
              (open ? '-translate-y-1.5 -rotate-45' : '')
            }
          />
        </span>
      </button>

      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 top-14 bg-bg/95 backdrop-blur z-30"
            onClick={() => setOpen(false)}
          />
          <nav className="md:hidden fixed left-0 right-0 top-14 z-40 bg-bg border-b border-line">
            <ul className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
              {links.map((l) => {
                const active = pathname === l.href;
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className={
                        'block px-4 py-3 rounded-md text-base ' +
                        (active ? 'bg-accent/10 text-accent font-semibold' : 'hover:bg-bg-elev')
                      }
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
              {isAdmin && (
                <li>
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 rounded-md text-base text-accent font-semibold hover:bg-bg-elev"
                  >
                    Admin
                  </Link>
                </li>
              )}
              <li className="mt-2 pt-3 border-t border-line">
                <form action={signOutAction} onClick={() => setOpen(false)}>
                  <button
                    type="submit"
                    className="block w-full text-left px-4 py-3 rounded-md text-base text-muted hover:bg-bg-elev"
                  >
                    Salir
                    {userEmail && (
                      <span className="block text-xs text-muted mt-0.5">{userEmail}</span>
                    )}
                  </button>
                </form>
              </li>
            </ul>
          </nav>
        </>
      )}
    </>
  );
}
