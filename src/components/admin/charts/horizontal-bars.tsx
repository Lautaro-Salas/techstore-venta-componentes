import type { ChartDatum } from "./bar-chart";

const ROW_HEIGHT = 36;
const BAR_HEIGHT = 14;
const BAR_TOP = 7;
const LABEL_WIDTH = 120;
const VALUE_WIDTH = 48;
const WIDTH = 480;
const FONT_SIZE = 14;
const TEXT_BASELINE = 19;

interface Props {
  data: ChartDatum[];
  title: string;
  summary: string;
}

/** Barras horizontales en SVG (ideal para distribuciones por categoría o estado). */
export function HorizontalBars({ data, title, summary }: Props) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const height = Math.max(ROW_HEIGHT, data.length * ROW_HEIGHT);
  const trackWidth = WIDTH - LABEL_WIDTH - VALUE_WIDTH;

  return (
    <figure>
      <svg viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label={`${title}. ${summary}`} className="h-auto w-full">
        {data.map((d, i) => {
          const y = i * ROW_HEIGHT;
          return (
            <g key={d.label}>
              <text x={0} y={y + TEXT_BASELINE} fontSize={FONT_SIZE} className="fill-foreground">{d.label}</text>
              <rect x={LABEL_WIDTH} y={y + BAR_TOP} width={trackWidth} height={BAR_HEIGHT} rx={BAR_HEIGHT / 2} className="fill-surface-2" />
              <rect x={LABEL_WIDTH} y={y + BAR_TOP} width={(d.value / max) * trackWidth} height={BAR_HEIGHT} rx={BAR_HEIGHT / 2} className="fill-primary">
                <title>{`${d.label}: ${d.display}`}</title>
              </rect>
              <text x={WIDTH} y={y + TEXT_BASELINE} fontSize={FONT_SIZE} textAnchor="end" className="fill-muted">{d.display}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">{summary}</figcaption>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr><th scope="col">Categoría</th><th scope="col">Valor</th></tr>
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
