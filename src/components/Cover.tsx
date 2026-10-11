import { LEVELS, type Item } from '@/lib/data';
import { hash } from '@/lib/text';
import { useStore } from '@/lib/store';

export function Cover({ item, size = 'md' }: { item: Item; size?: 'sm' | 'md' | 'lg' }) {
  const h = hash(item.t) % 360;
  const box = {
    sm: 'w-[54px] shrink-0 p-1.5',
    md: 'w-full p-2.5',
    lg: 'w-[150px] p-2.5 animate-sway',
  }[size];
  return (
    <div
      className={`cover squircle flex aspect-[2/3] origin-left flex-col justify-between rounded-[6px_14px_14px_6px] text-white shadow-[inset_6px_0_8px_-4px_#0006,0_8px_18px_#0003] [transform:perspective(600px)_rotateY(-12deg)] ${box}`}
      style={{
        backgroundColor: `hsl(${h} 38% 26%)`,
        backgroundImage: item.art
          ? `linear-gradient(180deg,#0008,transparent 55%,#000b),url(${item.art})`
          : undefined,
        backgroundSize: 'cover',
      }}
    >
      <span
        className={`font-serif font-semibold leading-tight text-balance drop-shadow-md ${size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-lg' : 'text-[13px]'}`}
      >
        {size === 'sm' ? item.t[0] : item.t}
      </span>
      {size !== 'sm' && (
        <div className="text-[9px] leading-tight drop-shadow-md">
          <span className="block font-semibold">{item.a}</span>
          <span className="mt-1 block uppercase tracking-[.12em] text-white/80">
            {item.rights === 'Original study note' ? 'Study notes' : item.k}
          </span>
        </div>
      )}
    </div>
  );
}

export function ItemRow({ item, onOpen }: { item: Item; onOpen: (id: string) => void }) {
  const { s } = useStore();
  const pos = s.pos[item.id] ?? 0;
  return (
    <button
      onClick={() => onOpen(item.id)}
      className="squircle mb-2.5 flex w-full items-center gap-3.5 rounded-[22px] bg-sf p-4 text-left shadow-[inset_0_0_0_1px_var(--ln)]"
    >
      <Cover item={item} size="sm" />
      <div className="flex-1">
        <b className="font-serif text-base font-semibold">{item.t}</b>
        <div className="text-[13px] text-mu">
          {item.rights === 'Original study note' ? 'Study note' : item.k} · {LEVELS[item.v]} ·{' '}
          {item.m} min{s.dl.includes(item.id) ? ' · offline' : ''}
        </div>
        {pos > 0.02 && (
          <div className="mt-2 h-[3px] rounded bg-ln">
            <div className="h-full rounded bg-ac" style={{ width: `${Math.round(pos * 100)}%` }} />
          </div>
        )}
      </div>
    </button>
  );
}
