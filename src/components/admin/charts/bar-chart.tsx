export interface ChartDatum {
  label: string;
  value: number;
  /** Valor formateado para tooltips y la tabla accesible. */
  display: string;
}

const WIDTH = 720;
const HEIGHT = 260;
const PADDING = { top: 16, right: 8, bottom: 32, left: 8 };
const BAR_GAP_RATIO = 0.3;
const GRID_LINES = 4;
const LABEL_EVERY = 2;
const LABEL_FONT_SIZE = 14;

interface Props {
  data: ChartDatum[];
  title: string;
  summary: string;
}

/** Gráfico de barras en SVG sin dependencias. Incluye una tabla oculta para lectores de pantalla. */
export function BarChart({ data, title, summary }: Props) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const slot = plotWidth / Math.max(1, data.length);
  const barWidth = slot * (1 - BAR_GAP_RATIO);

  return (
    <figure>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${title}. ${summary}`} className="h-auto w-full">
        {Array.from({ length: GRID_LINES + 1 }, (_, i) => {
          const y = PADDING.top + (plotHeight / GRID_LINES) * i;
          return <line key={i} x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} className="stroke-border" strokeDasharray={i === GRID_LINES ? undefined : "4 4"} />;
        })}
        {data.map((d, i) => {
          const height = (d.value / max) * plotHeight;
          const x = PADDING.left + slot * i + (slot - barWidth) / 2;
          const y = PADDING.top + plotHeight - height;
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={barWidth} height={Math.max(height, d.value > 0 ? 2 : 0)} rx={4} className="fill-primary">
                <title>{`${d.label}: ${d.display}`}</title>
              </rect>
              {i % LABEL_EVERY === data.length % LABEL_EVERY && (
                <text x={x + barWidth / 2} y={HEIGHT - 10} textAnchor="middle" fontSize={LABEL_FONT_SIZE} className="fill-muted">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">{summary}</figcaption>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr><th scope="col">Día</th><th scope="col">Valor</th></tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}><td>{d.label}</td><td>{d.display}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
