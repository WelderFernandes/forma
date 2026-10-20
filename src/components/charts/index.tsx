"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/**
 * Formatos serializáveis de eixo.
 *
 * Não aceitamos funções como prop porque os gráficos são Client Components:
 * Server Components não podem passar funções para eles. O formato é um
 * descritor serializável e a formatação acontece dentro do componente.
 */
export type ChartFormat = "number" | "kg" | "percent" | "cm" | "minutes";

function formatBy(value: number, format: ChartFormat): string {
  const rounded =
    Number.isInteger(value) ? value : Math.round(value * 10) / 10;
  switch (format) {
    case "kg":
      return `${new Intl.NumberFormat("pt-BR").format(rounded)} kg`;
    case "percent":
      return `${new Intl.NumberFormat("pt-BR").format(rounded)}%`;
    case "cm":
      return `${new Intl.NumberFormat("pt-BR").format(rounded)} cm`;
    case "minutes":
      return `${new Intl.NumberFormat("pt-BR").format(rounded)} min`;
    default:
      return new Intl.NumberFormat("pt-BR").format(rounded);
  }
}

/* ───────────────────────────── Linha ───────────────────────────── */

export function LineChart({
  data,
  color = "var(--chart-1)",
  height = 180,
  format = "number",
  className,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  format?: ChartFormat;
  className?: string;
}) {
  const id = React.useId();
  const W = 600;
  const H = height;
  const padX = 8;
  const padTop = 16;
  const padBottom = 26;

  if (data.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center text-sm text-muted-foreground", className)}
        style={{ height }}
      >
        Sem dados ainda
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const x = (i: number) =>
    padX + (i * (W - padX * 2)) / Math.max(1, data.length - 1);
  const y = (v: number) =>
    padTop + (1 - (v - min) / range) * (H - padTop - padBottom);

  const points = data.map((d, i) => `${x(i)},${y(d.value)}`);
  const linePath = points.length
    ? points.reduce((acc, p, i) => {
        const [px, py] = p.split(",").map(Number);
        if (i === 0) return `M ${px} ${py}`;
        const [prevX, prevY] = points[i - 1].split(",").map(Number);
        const cx = (prevX + px) / 2;
        return `${acc} C ${cx} ${prevY}, ${cx} ${py}, ${px} ${py}`;
      }, "")
    : "";
  const areaPath = linePath
    ? `${linePath} L ${x(data.length - 1)} ${H - padBottom} L ${x(0)} ${H - padBottom} Z`
    : "";

  const last = data[data.length - 1];

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
        role="img"
        aria-label="Gráfico de linha"
      >
        <defs>
          <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={0}
            x2={W}
            y1={padTop + t * (H - padTop - padBottom)}
            y2={padTop + t * (H - padTop - padBottom)}
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeDasharray="4 6"
          />
        ))}

        {areaPath && <path d={areaPath} fill={`url(#grad-${id})`} />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {data.map((d, i) => (
          <circle
            key={d.label + i}
            cx={x(i)}
            cy={y(d.value)}
            r={i === data.length - 1 ? 4.5 : 2.5}
            fill={color}
            stroke="var(--background)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      <div className="mt-1 flex justify-between px-1 text-[11px] text-muted-foreground">
        {data.map((d, i) => (
          <span key={d.label + i} className={cn(i % 2 === 1 && "hidden sm:inline")}>
            {d.label}
          </span>
        ))}
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        Último ponto:{" "}
        <span className="font-semibold text-foreground">
          {formatBy(last.value, format)}
        </span>
      </div>
    </div>
  );
}

/* ───────────────────────────── Barras ───────────────────────────── */

export function BarChart({
  data,
  height = 180,
  format = "number",
  highlightIndex,
  className,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  format?: ChartFormat;
  highlightIndex?: number;
  className?: string;
}) {
  if (data.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center text-sm text-muted-foreground", className)}
        style={{ height }}
      >
        Sem dados ainda
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          const active = highlightIndex === i;
          return (
            <div key={d.label + i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                {d.value > 0 ? formatBy(d.value, format) : ""}
              </span>
              <div
                className={cn(
                  "w-full rounded-t-lg transition-all",
                  active ? "bg-brand" : "bg-brand/35 hover:bg-brand/55",
                )}
                style={{ height: `${Math.max(d.value > 0 ? 4 : 2, pct * 0.82)}%` }}
                title={`${d.label}: ${formatBy(d.value, format)}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((d, i) => (
          <span
            key={d.label + i}
            className="min-w-0 flex-1 truncate text-center text-[11px] text-muted-foreground"
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────────── Radar ───────────────────────────── */

export function RadarChart({
  axes,
  color = "var(--chart-1)",
  size = 260,
  className,
}: {
  axes: { label: string; value: number }[];
  color?: string;
  size?: number;
  className?: string;
}) {
  const id = React.useId();
  if (axes.length < 3) {
    return (
      <div className={cn("flex items-center justify-center text-sm text-muted-foreground", className)}>
        Dados insuficientes para o gráfico de equilíbrio muscular
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 40;
  const max = Math.max(...axes.map((a) => a.value), 1);

  const pointAt = (i: number, ratio: number) => {
    const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    return [cx + Math.cos(angle) * radius * ratio, cy + Math.sin(angle) * radius * ratio];
  };

  const polygon = axes
    .map((a, i) => {
      const [px, py] = pointAt(i, a.value / max);
      return `${px},${py}`;
    })
    .join(" ");

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className={cn("w-full", className)}>
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full" style={{ maxWidth: size }}>
        <defs>
          <linearGradient id={`radar-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0.12" />
          </linearGradient>
        </defs>

        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={axes
              .map((_, i) => pointAt(i, level).map((n) => n.toFixed(1)).join(","))
              .join(" ")}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.1"
          />
        ))}

        {axes.map((_, i) => {
          const [px, py] = pointAt(i, 1);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={px}
              y2={py}
              stroke="currentColor"
              strokeOpacity="0.1"
            />
          );
        })}

        <polygon points={polygon} fill={`url(#radar-${id})`} stroke={color} strokeWidth="2" />

        {axes.map((a, i) => {
          const [px, py] = pointAt(i, a.value / max);
          return <circle key={a.label + i} cx={px} cy={py} r="3" fill={color} />;
        })}

        {axes.map((a, i) => {
          const [px, py] = pointAt(i, 1.18);
          return (
            <text
              key={a.label + i}
              x={px}
              y={py}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {a.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ───────────────────────────── Rosca ───────────────────────────── */

export function DonutChart({
  segments,
  size = 180,
  thickness = 22,
  centerLabel,
  centerValue,
  className,
}: {
  segments: { label: string; value: number; color?: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
}) {
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={cn("flex flex-col items-center gap-4 sm:flex-row sm:items-center", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" style={{ width: size, height: size }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth={thickness}
          />
          {total > 0 &&
            segments.map((s, i) => {
              const portion = s.value / total;
              const dash = portion * circumference;
              const el = (
                <circle
                  key={s.label + i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={thickness}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += dash;
              return el;
            })}
        </svg>
        {(centerValue || centerLabel) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && (
              <span className="text-xl font-semibold tabular-nums">{centerValue}</span>
            )}
            {centerLabel && (
              <span className="text-[11px] text-muted-foreground">{centerLabel}</span>
            )}
          </div>
        )}
      </div>

      <ul className="flex flex-col gap-2 text-sm">
        {segments.map((s, i) => (
          <li key={s.label + i} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ background: s.color ?? CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="ml-auto font-medium tabular-nums">
              {total > 0 ? Math.round((s.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { CHART_COLORS };
