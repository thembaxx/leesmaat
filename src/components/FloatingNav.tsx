'use client';
import { BookmarkSimpleIcon, HouseIcon, LightningIcon } from '@phosphor-icons/react';

export type Tab = 'home' | 'practice' | 'bookmarks';
const TABS = [
  { id: 'home', label: 'Home', Icon: HouseIcon },
  { id: 'practice', label: 'Practice', Icon: LightningIcon },
  { id: 'bookmarks', label: 'Bookmarks', Icon: BookmarkSimpleIcon },
] as const;

export function FloatingNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const i = TABS.findIndex((t) => t.id === tab);
  return (
    <nav
      aria-label="Main navigation"
      className="glass native-bottom absolute left-1/2 z-10 flex -translate-x-1/2 gap-0.5 rounded-full p-[7px]"
    >
      <div
        className="absolute top-[7px] left-[7px] h-12 w-16 rounded-full bg-ln transition-transform duration-500 ease-[cubic-bezier(.34,1.45,.64,1)]"
        style={{ transform: `translateX(${i * 66}px)` }}
      />
      {TABS.map(({ id, label, Icon }) => {
        const on = id === tab;
        return (
          <button
            key={id}
            aria-label={label}
            title={label}
            aria-current={on ? 'page' : undefined}
            onClick={() => onChange(id)}
            className="relative grid h-12 w-16 place-items-center"
          >
            <Icon
              key={on ? 'on' : 'off'}
              size={26}
              weight={on ? 'fill' : 'regular'}
              className={on ? 'animate-pop' : ''}
            />
          </button>
        );
      })}
    </nav>
  );
}
