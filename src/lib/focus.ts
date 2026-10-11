'use client';
import { useEffect, type RefObject } from 'react';
/** Full-screen views stay within the app's phone-width container. */
export function useFocusScope(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current,
      previous = document.activeElement as HTMLElement | null;
    const candidates = () =>
      [
        ...(root?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input,textarea,[tabindex="0"]',
        ) ?? []),
      ].filter((node) => node.getClientRects().length > 0 && !node.closest('[inert]'));
    const key = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const list = candidates(),
        first = list[0],
        last = list[list.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || !list.includes(document.activeElement as HTMLElement))
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !list.includes(document.activeElement as HTMLElement))
      ) {
        event.preventDefault();
        first?.focus();
      }
    };
    candidates()[0]?.focus();
    root?.addEventListener('keydown', key);
    return () => {
      root?.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, [ref]);
}
