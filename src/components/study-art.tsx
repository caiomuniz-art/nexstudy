import { cn } from "@/lib/text";

const NAVY = "#003878";
const CYAN = "#38d0fc";
const PAPER = "#f4fcff";
const INK = "#02152c";

const labels = {
  estudo: "Composição de estudo: caderno, relógio e lista de tarefas.",
  calendario: "Composição de calendário: grade do mês com um dia marcado.",
  horario: "Composição de horário: blocos da semana letiva.",
} as const;

export type StudyScene = keyof typeof labels;

export function StudyArt({
  scene,
  decorative = false,
  className,
}: {
  scene: StudyScene;
  decorative?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 320 188"
      className={cn("block h-auto w-full max-w-full", className)}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : labels[scene]}
      focusable="false"
    >
      {scene === "estudo" ? <StudySceneArt /> : null}
      {scene === "calendario" ? <CalendarSceneArt /> : null}
      {scene === "horario" ? <ScheduleSceneArt /> : null}
    </svg>
  );
}

function StudySceneArt() {
  return (
    <g>
      <rect width="320" height="188" rx="16" fill={NAVY} />
      <rect width="320" height="8" fill={CYAN} />
      <rect x="18" y="26" width="168" height="140" rx="8" fill={PAPER} />
      <rect x="18" y="26" width="14" height="140" fill={CYAN} />
      <rect x="28" y="26" width="6" height="140" fill={CYAN} />
      {[0, 1, 2, 3, 4, 5].map((line) => (
        <rect
          key={line}
          x="48"
          y={46 + line * 18}
          width={line === 5 ? 86 : 120}
          height="4"
          rx="2"
          fill={NAVY}
          opacity={line % 2 === 0 ? 0.55 : 0.28}
        />
      ))}
      <circle cx="250" cy="72" r="42" fill={PAPER} />
      <circle cx="250" cy="72" r="34" fill="none" stroke={NAVY} strokeWidth="3" />
      {[0, 90, 180, 270].map((angle) => (
        <line
          key={angle}
          x1="250"
          y1="44"
          x2="250"
          y2="50"
          stroke={CYAN}
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${angle} 250 72)`}
        />
      ))}
      <path d="M250 72 V52" stroke={NAVY} strokeWidth="3" strokeLinecap="round" />
      <path d="M250 72 L268 84" stroke={CYAN} strokeWidth="3" strokeLinecap="round" />
      <circle cx="250" cy="72" r="3.5" fill={CYAN} />
      <rect x="204" y="124" width="100" height="44" rx="8" fill={INK} opacity="0.28" />
      <rect x="214" y="134" width="14" height="14" rx="2" fill={CYAN} />
      <path d="M217.5 141.2 l2.4 2.4 5.2-5.4" fill="none" stroke={NAVY} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="234" y="138" width="58" height="6" rx="3" fill={PAPER} />
      <rect x="214" y="154" width="14" height="6" rx="2" fill={PAPER} opacity="0.45" />
      <rect x="234" y="154" width="40" height="6" rx="3" fill={PAPER} opacity="0.8" />
    </g>
  );
}

function CalendarSceneArt() {
  const cells = [];
  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 7; column += 1) {
      const marked = row === 1 && column === 3;
      cells.push(
        <rect
          key={`${row}-${column}`}
          x={24 + column * 39}
          y={58 + row * 22}
          width="32"
          height="16"
          rx="3"
          fill={marked ? CYAN : NAVY}
          opacity={marked ? 1 : 0.14}
        />,
      );
    }
  }

  return (
    <g>
      <rect width="320" height="188" rx="16" fill={NAVY} />
      <rect x="14" y="16" width="292" height="156" rx="10" fill={PAPER} />
      <rect x="14" y="16" width="292" height="30" rx="10" fill={CYAN} />
      <rect x="14" y="34" width="292" height="12" fill={CYAN} />
      <rect x="28" y="26" width="46" height="8" rx="4" fill={NAVY} />
      <rect x="246" y="26" width="18" height="8" rx="2" fill={NAVY} opacity="0.45" />
      <rect x="270" y="26" width="18" height="8" rx="2" fill={NAVY} opacity="0.45" />
      {cells}
      <path d="M286 150 l8 8 -8 8 -8 -8 z" fill={CYAN} />
    </g>
  );
}

function ScheduleSceneArt() {
  const blocks: Array<[number, number, number, string]> = [
    [0, 0, 2, NAVY],
    [0, 3, 1, CYAN],
    [1, 1, 2, CYAN],
    [2, 0, 1, NAVY],
    [2, 2, 2, NAVY],
    [3, 2, 1, CYAN],
    [3, 4, 1, NAVY],
    [4, 0, 2, NAVY],
    [4, 3, 2, CYAN],
  ];

  return (
    <g>
      <rect width="320" height="188" rx="16" fill={NAVY} />
      <rect x="14" y="16" width="292" height="156" rx="10" fill={INK} opacity="0.28" />
      {[0, 1, 2, 3, 4, 5].map((slot) => (
        <line
          key={slot}
          x1="48"
          x2="294"
          y1={36 + slot * 24}
          y2={36 + slot * 24}
          stroke={PAPER}
          strokeOpacity="0.18"
        />
      ))}
      {blocks.map(([column, start, span, fill]) => (
        <rect
          key={`${column}-${start}`}
          x={56 + column * 48}
          y={40 + start * 24}
          width="40"
          height={span * 24 - 8}
          rx="5"
          fill={fill}
        />
      ))}
      <line x1="48" x2="294" y1="100" y2="100" stroke={CYAN} strokeWidth="2" />
      <circle cx="48" cy="100" r="4" fill={CYAN} />
    </g>
  );
}
