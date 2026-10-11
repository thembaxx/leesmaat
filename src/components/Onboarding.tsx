'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { dailyItem, LEVELS, PLACEMENT, type Lang } from '@/lib/data';
import { today } from '@/lib/text';
import { useStore } from '@/lib/store';
import { useFocusScope } from '@/lib/focus';
import { Cover } from './Cover';
const Opt = ({
  onClick,
  children,
  serif,
}: {
  onClick: () => void;
  children: ReactNode;
  serif?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`squircle w-full rounded-[22px] bg-sf p-4 text-left text-base shadow-[inset_0_0_0_1px_var(--ln)] ${serif ? 'font-serif' : ''}`}
  >
    {children}
  </button>
);
export function Onboarding() {
  const { s, set } = useStore();
  const [step, setStep] = useState(0),
    [lang, setLang] = useState<Lang>(s.lang);
  const [sentence, setSentence] = useState(0),
    [vocabulary, setVocabulary] = useState(0),
    [comprehension, setComprehension] = useState(0);
  const root = useRef<HTMLDialogElement>(null);
  useFocusScope(root);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    title.current?.focus();
  }, [step]);
  const pl = PLACEMENT[lang],
    points = sentence + vocabulary + comprehension;
  const level = points < 2 ? 0 : points < 4 ? 1 : 2;
  const af = lang === 'af';
  const passage = af
    ? 'Lebo het ’n sambreel saamgeneem, al was die lug helder. Later het donker wolke verskyn. Sy het haar sambreel met ’n maat gedeel.'
    : 'Lebo carried an umbrella even though the sky was clear. Later, dark clouds arrived. She shared her umbrella with a friend.';
  const finish = () =>
    set((old) => ({
      ob: true,
      lang,
      lv: level,
      levels: { ...old.levels, [lang]: level },
      placed: { ...old.placed, [lang]: true },
    }));
  return (
    <dialog
      open
      ref={root}
      aria-modal="true"
      aria-label="Reading placement"
      className="absolute inset-0 z-30 m-0 flex h-full max-h-none w-full max-w-none flex-col overflow-y-auto border-0 bg-bg px-6 pt-5 pb-7 text-ink"
    >
      <div aria-label={`Step ${Math.min(step + 1, 5)} of 5`} className="mb-5 flex gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <i key={i} className={`h-[5px] flex-1 rounded ${i <= step ? 'bg-ink' : 'bg-ln'}`} />
        ))}
      </div>
      {step > 0 && (
        <button
          onClick={() => setStep(step - 1)}
          className="mb-4 self-start rounded-full bg-ln px-4 py-2 text-sm"
        >
          Back
        </button>
      )}
      <div key={step} className="flex flex-1 animate-rise flex-col gap-3.5">
        {step === 0 && (
          <>
            <div aria-hidden="true" className="relative h-52">
              {[
                ['Read', 'left-[6%] top-8 -rotate-6'],
                ['Lees', 'right-[4%] top-1.5 rotate-6'],
                ['Listen', 'left-[30%] top-[104px] -rotate-3'],
              ].map(([text, pos]) => (
                <b
                  key={text}
                  className={`squircle absolute animate-float rounded-[26px] bg-sf px-6 py-4 font-serif text-2xl shadow-xl ${pos}`}
                >
                  {text}
                </b>
              ))}
            </div>
            <h1 ref={title} tabIndex={-1} className="text-3xl font-bold">
              Read a little.
              <br />
              Understand a lot.
            </h1>
            <p className="text-sm text-mu">
              English and Afrikaans, five minutes at a time. Three quick steps to find your starting
              level. Each language gets its own level.
            </p>
            <button
              onClick={() => setStep(1)}
              className="mt-auto rounded-[18px] bg-ink p-[18px] font-semibold text-bg"
            >
              Get started
            </button>
          </>
        )}
        {step === 1 && (
          <>
            <h1 ref={title} tabIndex={-1} className="text-3xl font-bold">
              What do you want to read first?
            </h1>
            {(['en', 'af'] as const).map((g) => (
              <Opt
                key={g}
                onClick={() => {
                  setLang(g);
                  setSentence(0);
                  setVocabulary(0);
                  setComprehension(0);
                  setStep(2);
                }}
              >
                <b className="block text-[22px]">{g === 'en' ? 'English' : 'Afrikaans'}</b>
                <small className="text-mu">Stories, poems and short reads</small>
              </Opt>
            ))}
          </>
        )}
        {step === 2 && (
          <>
            <h1 ref={title} tabIndex={-1} className="text-3xl font-bold">
              Pick the hardest sentence you still read easily.
            </h1>
            {pl.c.map((text, i) => (
              <Opt
                key={text}
                serif
                onClick={() => {
                  setSentence(i);
                  setStep(3);
                }}
              >
                {text}
              </Opt>
            ))}
          </>
        )}
        {step === 3 && (
          <>
            <h1 ref={title} tabIndex={-1} className="text-3xl font-bold">
              What does “{pl.w}” mean?
            </h1>
            {pl.o.map((text, i) => (
              <Opt
                key={text}
                onClick={() => {
                  setVocabulary(i === pl.a ? 1 : 0);
                  setStep(4);
                }}
              >
                {text}
              </Opt>
            ))}
          </>
        )}
        {step === 4 && (
          <>
            <h1 ref={title} tabIndex={-1} className="text-3xl font-bold">
              What can you infer?
            </h1>
            <p lang={lang} className="rounded-2xl bg-sf p-4 font-serif text-lg leading-relaxed">
              {passage}
            </p>
            <p className="text-sm text-mu">
              {af
                ? 'Wat sê Lebo se optrede oor haar?'
                : 'What does Lebo’s action suggest about her?'}
            </p>
            {(af
              ? [
                  'Sy dink vooruit en gee om vir ander',
                  'Sy hou nie van haar maat nie',
                  'Sy het geweet die son sou heeldag skyn',
                ]
              : [
                  'She plans ahead and cares about others',
                  'She dislikes her friend',
                  'She knew it would be sunny all day',
                ]
            ).map((text, i) => (
              <Opt
                key={text}
                onClick={() => {
                  setComprehension(i === 0 ? 2 : 0);
                  setStep(5);
                }}
              >
                {text}
              </Opt>
            ))}
          </>
        )}
        {step === 5 && (
          <>
            <h1 ref={title} tabIndex={-1} className="text-3xl font-bold">
              You’re set.
            </h1>
            <p className="text-sm text-mu">
              Your {af ? 'Afrikaans' : 'English'} starting level is <b>{LEVELS[level]}</b>. You can
              retake this any time in settings.
            </p>
            <div className="grid min-h-56 flex-1 place-items-center">
              <Cover item={dailyItem(lang, today())} size="lg" />
            </div>
            <button
              onClick={finish}
              className="mt-auto rounded-[18px] bg-ink p-[18px] font-semibold text-bg"
            >
              Start reading
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}
