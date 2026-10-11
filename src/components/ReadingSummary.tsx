import { ArrowUpRightIcon } from '@phosphor-icons/react/ssr';
import type { Item } from '@/lib/data';
import { SUMMARY_COPY, type ReadingSummary, type SummaryPoint } from '@/lib/summaries';

/** Pure presentation shared by the server-rendered title and offline reader. */
export function SummaryContent({
  item,
  summary,
  onPassage,
}: {
  item: Item;
  summary: ReadingSummary;
  onPassage?: (point: SummaryPoint) => void;
}) {
  const copy = SUMMARY_COPY[item.g];
  return (
    <div lang={item.g} className="font-sans text-sm leading-relaxed">
      <p className="mb-3 text-xs font-semibold text-ac">
        {copy[summary.scope]} · {summary.seconds} s
      </p>
      {summary.scope !== 'read' && (
        <p className="mb-4 rounded-xl bg-ln p-3 text-mu">
          {summary.scope === 'excerpt' ? copy.excerptNotice : copy.notesNotice}
        </p>
      )}
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-mu">
        {copy.overview}
      </h3>
      <p className="font-serif text-lg leading-relaxed">{summary.overview}</p>
      <h3 className="mt-6 mb-3 text-sm font-bold">{copy.points}</h3>
      <ol className="space-y-3">
        {summary.points.map((point, index) => (
          <li key={point.start} className="flex gap-3 rounded-2xl border border-ln bg-sf p-3">
            <span
              aria-hidden="true"
              className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ln text-xs font-semibold text-ac"
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              {point.label && <h4 className="mb-1 font-semibold">{point.label}</h4>}
              <p>{point.text}</p>
              <p className="mt-1 text-xs text-mu">
                {copy.paragraph} {point.paragraph + 1}
              </p>
            </div>
            {onPassage ? (
              <button
                aria-label={`${copy.passage}: ${point.label ?? index + 1}`}
                title={copy.passage}
                onClick={() => onPassage(point)}
                className="grid size-11 shrink-0 place-items-center self-center rounded-full bg-ln text-ac"
              >
                <ArrowUpRightIcon size={20} />
              </button>
            ) : (
              <a
                href={`#passage-${point.paragraph}`}
                aria-label={`${copy.passage}: ${point.label ?? index + 1}`}
                title={copy.passage}
                className="grid size-11 shrink-0 place-items-center self-center rounded-full bg-ln text-ac"
              >
                <ArrowUpRightIcon size={20} />
              </a>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-5 text-xs text-mu">{copy[summary.method]}</p>
    </div>
  );
}
export function PublicSummary({ item, summary }: { item: Item; summary: ReadingSummary }) {
  const copy = SUMMARY_COPY[item.g];
  return (
    <details lang={item.g} className="summary-details mb-8 rounded-3xl border border-ln bg-sf">
      <summary className="cursor-pointer rounded-3xl px-5 py-4 text-sm font-semibold">
        <span className="ml-2 inline-flex items-center gap-2 align-middle">
          {copy.title}
          <span className="text-xs font-normal text-mu">· {summary.seconds} s</span>
        </span>
      </summary>
      <div className="px-5 pt-1 pb-5">
        <SummaryContent item={item} summary={summary} />
      </div>
    </details>
  );
}
