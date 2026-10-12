import Image from 'next/image';
import type { Item } from '@/lib/data';
export function EditionCover({ item }: { item: Item }) {
  return (
    <div className="relative aspect-[2/3] overflow-hidden rounded-[6px_18px_18px_6px] bg-ink text-bg shadow-lg">
      {item.cover ? (
        <Image
          unoptimized
          src={item.cover}
          alt={`${item.t} source-edition cover`}
          width={400}
          height={600}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full flex-col justify-between p-4">
          <span className="font-serif text-lg leading-tight">{item.t}</span>
          <span className="text-xs">
            {item.a}
            <span className="mt-2 block text-[10px]">
              {item.rights === 'Catalogue metadata'
                ? 'Catalogue record'
                : (item.collection ?? item.k)}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
