"use client";

import { BloubBot } from "@/components/portfolio/bloub-bot";
import { cn } from "@/lib/utils";
import {
  EXPRESSIONS,
  SELECTABLE_STATES,
  SHAPES,
  STATE_BY_ID,
  toExpressionId,
  toShapeId,
  toStateId,
  type ExpressionId,
  type ShapeId,
  type StateId,
} from "@/lib/bloub-engine";
import { useEffect, useState, type ReactNode } from "react";

const SHAPE_LABEL: Record<ShapeId, string> = {
  cercle: "Круг",
  galet: "Галька",
  squircle: "Сквиркл",
  capsule: "Капсула",
  triangle: "Треугольник",
  hexagone: "Шестиугольник",
  nuage: "Облако",
  goutte: "Капля",
};

const EXPRESSION_LABEL: Record<ExpressionId, string> = {
  neutre: "Нейтральный",
  attentif: "Внимательный",
  surpris: "Удивлён",
  excite: "В восторге",
  heureux: "Радостный",
  hilare: "Смеётся",
  colere: "Злой",
  triste: "Грустный",
  effraye: "Испуган",
  mefiant: "Подозрительный",
  confus: "Растерян",
  curieux: "Любопытный",
  fier: "Гордый",
  timide: "Смущённый",
  blase: "Равнодушный",
  somnolent: "Сонный",
};

const STATE_LABEL: Record<StateId, string> = {
  idle: "Покой",
  thinking: "Думает",
  wink: "Подмигивает",
  wide: "Широкий взгляд",
  alert: "Тревога",
  notify: "Уведомление",
  exclaim: "Восклицание",
  sleep: "Сон",
  egg: "Яйцо",
  hexagon: "Шестиугольник",
  play: "Игра",
  orbit: "Орбита",
  burst: "Вспышка",
  comet: "Комета",
  swirl: "Завихрение",
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function OptionButton({
  selected,
  label,
  onSelect,
  children,
}: {
  selected: boolean;
  label: string;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex min-w-0 flex-col items-center gap-1 rounded-2xl border-2 px-1 py-2 text-center text-caption2 leading-tight",
        selected
          ? "border-text-primary text-text-primary"
          : "border-transparent text-text-secondary hover:bg-surface-control",
      )}
    >
      <span className="flex h-14 w-full items-center justify-center">{children}</span>
      <span>{label}</span>
    </button>
  );
}

export function BloubSettings({
  shape: shapeRaw,
  state: stateRaw,
  expression: expressionRaw,
  onChange,
}: {
  shape: string;
  state: string;
  expression: string | null;
  onChange: (patch: {
    bloubShape?: string;
    bloubState?: string;
    bloubExpression?: string | null;
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const reduced = usePrefersReducedMotion();
  const shape = toShapeId(shapeRaw);
  const state = toStateId(stateRaw);
  const expression = toExpressionId(expressionRaw) ?? "neutre";
  const summary = `${SHAPE_LABEL[shape]} · ${EXPRESSION_LABEL[expression]} · ${STATE_LABEL[state]}`;
  const def = STATE_BY_ID.get(state);
  const keepsShape = def?.baseBody ?? true;
  const keepsFace = def?.baseFace ?? true;
  const lookNote = !keepsShape
    ? "Эта анимация рисует свою фигуру и своё лицо. Форма видна в покое, подмигивании, широком взгляде и уведомлении. Выражение — в покое."
    : !keepsFace
      ? "Эта анимация рисует своё лицо. Выбранное выражение видно в покое."
      : null;

  return (
    <section className="rounded-[20px] border border-border-subtle bg-surface-page">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <span className="flex size-14 shrink-0 items-center justify-center">
          <BloubBot
            state={state}
            expression={expression}
            shape={shape}
            size={48}
            paused={open}
            frozen={reduced}
            label={summary}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-body text-text-primary">Bloub</span>
          <span className="block truncate text-caption1 text-text-muted">{summary}</span>
        </span>
        <span className="shrink-0 text-caption1 text-text-secondary">
          {open ? "Свернуть" : "Настроить"}
        </span>
      </button>

      {open ? (
        <div className="space-y-5 border-t border-border-subtle px-3 pt-4 pb-4">
          <div className="flex justify-center rounded-[20px] bg-surface-control py-6">
            <BloubBot
              state={state}
              expression={expression}
              shape={shape}
              size={120}
              frozen={reduced}
              label={summary}
            />
          </div>

          <div className="space-y-2">
            <h4 className="text-body text-text-primary">Форма</h4>
            <div role="radiogroup" aria-label="Форма" className="grid grid-cols-4 gap-1">
              {SHAPES.map((item) => (
                <OptionButton
                  key={item.id}
                  selected={item.id === shape}
                  label={SHAPE_LABEL[item.id]}
                  onSelect={() => onChange({ bloubShape: item.id })}
                >
                  <BloubBot
                    state="idle"
                    expression="neutre"
                    shape={item.id}
                    size={44}
                    frozen
                    label={SHAPE_LABEL[item.id]}
                  />
                </OptionButton>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-body text-text-primary">Выражение</h4>
            <div role="radiogroup" aria-label="Выражение" className="grid grid-cols-4 gap-1">
              {EXPRESSIONS.map((item) => (
                <OptionButton
                  key={item.id}
                  selected={item.id === expression}
                  label={EXPRESSION_LABEL[item.id]}
                  onSelect={() => onChange({ bloubExpression: item.id })}
                >
                  <BloubBot
                    state="idle"
                    expression={item.id}
                    shape={shape}
                    size={44}
                    frozen
                    label={EXPRESSION_LABEL[item.id]}
                  />
                </OptionButton>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-body text-text-primary">Анимация</h4>
            <div role="radiogroup" aria-label="Анимация" className="grid grid-cols-4 gap-1">
              {SELECTABLE_STATES.map((id) => (
                <OptionButton
                  key={id}
                  selected={id === state}
                  label={STATE_LABEL[id]}
                  onSelect={() => onChange({ bloubState: id })}
                >
                  <BloubBot
                    state={id}
                    expression={expression}
                    shape={shape}
                    size={40}
                    frozen
                    label={STATE_LABEL[id]}
                  />
                </OptionButton>
              ))}
            </div>
            {lookNote ? (
              <p className="text-caption2 text-text-muted">{lookNote}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
