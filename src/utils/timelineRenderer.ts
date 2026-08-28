import type { VisibleRange } from '@/types/timeline';
import type { ParsedCsvData } from '@/types/csv';
import type { Signal } from '@/types/signal';

export const TIMELINE_RULER_HEIGHT = 28;
export const PLAYHEAD_HIT_WIDTH = 10;
export const MIN_VISIBLE_SPAN_MS = 100;

export interface TimelineView {
  viewStart: number;
  viewEnd: number;
  spanMs: number;
  pxPerMs: number;
}

export interface TimelineRenderOptions {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  visibleRange: VisibleRange;
  currentTime: number;
  parsedSignals: ParsedCsvData | null;
  signals: Signal[];
  signalWindowOffsetMs: number;
}

const COLORS = {
  background: '#111827',
  border: '#243044',
  gridMinor: '#1a2332',
  gridMajor: '#243044',
  rulerBackground: '#0c1220',
  tickMinor: '#334155',
  tickMajor: '#475569',
  label: '#64748b',
  playhead: '#22d3ee',
  playheadGlow: 'rgba(34, 211, 238, 0.35)',
  signalLabelOutline: 'rgba(12, 18, 32, 0.95)',
} as const;

const SIGNAL_COLORS = [
  '#22d3ee',
  '#a78bfa',
  '#34d399',
  '#fbbf24',
  '#f472b6',
  '#60a5fa',
] as const;
const SIGNAL_LABEL_WIDTH = 190;
const SIGNAL_VALUE_LABEL_GAP = 7;
const SIGNAL_VALUE_LABEL_PADDING_X = 5;
const MAX_SCALE_SAMPLES = 4_096;
const MAX_BUCKET_SAMPLES = 16;

const TICK_STEPS_MS = [
  1, 2, 5, 10, 20, 50, 100, 200, 500, 1_000, 2_000, 5_000, 10_000, 15_000,
  30_000, 60_000, 120_000, 300_000, 600_000, 1_800_000, 3_600_000,
];

export function getTimelineView(
  visibleRange: VisibleRange,
  width: number,
): TimelineView {
  const spanMs = Math.max(
    visibleRange.end - visibleRange.start,
    MIN_VISIBLE_SPAN_MS,
  );
  const pxPerMs = width / spanMs;

  return {
    viewStart: visibleRange.start,
    viewEnd: visibleRange.end,
    spanMs,
    pxPerMs,
  };
}

export function timeToX(timeMs: number, view: TimelineView): number {
  return (timeMs - view.viewStart) * view.pxPerMs;
}

export function xToTime(x: number, view: TimelineView): number {
  return view.viewStart + x / view.pxPerMs;
}

function getTickIntervals(spanMs: number): {
  majorMs: number;
  minorMs: number;
} {
  const targetMajorCount = 8;
  const rawMajor = spanMs / targetMajorCount;
  const majorMs =
    TICK_STEPS_MS.find((step) => step >= rawMajor) ??
    TICK_STEPS_MS[TICK_STEPS_MS.length - 1]!;

  const minorMs = majorMs / 5;

  return { majorMs, minorMs };
}

export function formatTimelineLabel(timeMs: number): string {
  const absMs = Math.abs(timeMs);
  const sign = timeMs < 0 ? '-' : '';

  if (absMs < 1_000) {
    return `${sign}${Math.round(absMs)}ms`;
  }

  const totalSeconds = absMs / 1_000;
  if (totalSeconds < 60) {
    const precision = totalSeconds < 10 ? 1 : 0;
    return `${sign}${totalSeconds.toFixed(precision)}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${sign}${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = COLORS.rulerBackground;
  ctx.fillRect(0, 0, width, TIMELINE_RULER_HEIGHT);

  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, TIMELINE_RULER_HEIGHT + 0.5);
  ctx.lineTo(width, TIMELINE_RULER_HEIGHT + 0.5);
  ctx.stroke();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  view: TimelineView,
): void {
  const { majorMs, minorMs } = getTickIntervals(view.spanMs);
  const gridTop = TIMELINE_RULER_HEIGHT;
  const gridHeight = height - gridTop;
  const firstMinor = Math.floor(view.viewStart / minorMs) * minorMs;

  for (let timeMs = firstMinor; timeMs <= view.viewEnd; timeMs += minorMs) {
    if (timeMs < view.viewStart) {
      continue;
    }

    const x = Math.round(timeToX(timeMs, view)) + 0.5;
    if (x < 0 || x > width) {
      continue;
    }

    const isMajor = timeMs % majorMs === 0;
    ctx.strokeStyle = isMajor ? COLORS.gridMajor : COLORS.gridMinor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, gridTop);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  const horizontalLines = 4;
  const rowHeight = gridHeight / horizontalLines;
  ctx.strokeStyle = COLORS.gridMinor;
  for (let index = 1; index < horizontalLines; index += 1) {
    const y = Math.round(gridTop + rowHeight * index) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawTicks(
  ctx: CanvasRenderingContext2D,
  width: number,
  view: TimelineView,
): void {
  const { majorMs, minorMs } = getTickIntervals(view.spanMs);
  const firstMinor = Math.floor(view.viewStart / minorMs) * minorMs;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = '10px JetBrains Mono, ui-monospace, monospace';

  for (let timeMs = firstMinor; timeMs <= view.viewEnd; timeMs += minorMs) {
    if (timeMs < view.viewStart) {
      continue;
    }

    const x = Math.round(timeToX(timeMs, view)) + 0.5;
    if (x < 0 || x > width) {
      continue;
    }

    const isMajor = timeMs % majorMs === 0;
    const tickHeight = isMajor ? 10 : 5;
    ctx.strokeStyle = isMajor ? COLORS.tickMajor : COLORS.tickMinor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, TIMELINE_RULER_HEIGHT - tickHeight);
    ctx.lineTo(x, TIMELINE_RULER_HEIGHT);
    ctx.stroke();

    if (isMajor) {
      ctx.fillStyle = COLORS.label;
      ctx.fillText(formatTimelineLabel(timeMs), x, 4);
    }
  }
}

function lowerBound(values: Float64Array, target: number): number {
  let low = 0;
  let high = values.length;

  while (low < high) {
    const middle = low + ((high - low) >> 1);
    if (values[middle]! < target) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  return low;
}

function getNearestSampleIndex(
  timestamps: Float64Array,
  targetTime: number,
): number | null {
  if (timestamps.length === 0) {
    return null;
  }

  const nextIndex = lowerBound(timestamps, targetTime);
  if (nextIndex === 0) {
    return 0;
  }
  if (nextIndex >= timestamps.length) {
    return timestamps.length - 1;
  }

  const previousIndex = nextIndex - 1;
  return targetTime - timestamps[previousIndex]! <=
    timestamps[nextIndex]! - targetTime
    ? previousIndex
    : nextIndex;
}

function formatSignalValue(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }

  const magnitude = Math.abs(value);
  if ((magnitude > 0 && magnitude < 0.001) || magnitude >= 1_000_000) {
    return value.toExponential(3);
  }

  return Number(value.toPrecision(6)).toString();
}

function getVisibleValueRange(
  values: Float64Array,
  startIndex: number,
  endIndex: number,
): { min: number; max: number } {
  const count = Math.max(endIndex - startIndex, 1);
  const stride = Math.max(1, Math.ceil(count / MAX_SCALE_SAMPLES));
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (let index = startIndex; index < endIndex; index += stride) {
    const value = values[index];
    if (value === undefined || !Number.isFinite(value)) {
      continue;
    }
    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 1 };
  }

  if (min === max) {
    const padding = Math.max(Math.abs(min) * 0.05, 0.5);
    return { min: min - padding, max: max + padding };
  }

  return { min, max };
}

function drawSignalTracks(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  view: TimelineView,
  parsed: ParsedCsvData,
  signals: Signal[],
  signalWindowOffsetMs: number,
  markerTime: number,
): void {
  const visibleSignals = signals.filter((signal) => signal.visible);
  if (visibleSignals.length === 0 || parsed.timestamps.length === 0) {
    return;
  }

  const contentTop = TIMELINE_RULER_HEIGHT;
  const contentHeight = height - contentTop;
  const trackHeight = contentHeight / visibleSignals.length;
  const startIndex = Math.max(
    0,
    lowerBound(parsed.timestamps, view.viewStart + signalWindowOffsetMs) - 1,
  );
  const endIndex = Math.min(
    parsed.timestamps.length,
    lowerBound(parsed.timestamps, view.viewEnd + signalWindowOffsetMs) + 1,
  );
  const markerX = timeToX(markerTime, view);
  const markerSampleIndex = getNearestSampleIndex(
    parsed.timestamps,
    markerTime + signalWindowOffsetMs,
  );
  const markerIsVisible =
    markerTime >= view.viewStart &&
    markerTime <= view.viewEnd &&
    markerSampleIndex !== null;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, contentTop, width, contentHeight);
  ctx.clip();

  visibleSignals.forEach((signal, trackIndex) => {
    const values = parsed.signalValues[signal.index];
    if (!values) {
      return;
    }

    const trackTop = contentTop + trackIndex * trackHeight;
    const trackBottom = trackTop + trackHeight;
    const verticalPadding = Math.min(8, trackHeight * 0.18);
    const drawableHeight = Math.max(trackHeight - verticalPadding * 2, 1);
    const range = getVisibleValueRange(values, startIndex, endIndex);
    const valueSpan = range.max - range.min;
    const valueToY = (value: number) =>
      trackBottom -
      verticalPadding -
      ((value - range.min) / valueSpan) * drawableHeight;

    ctx.strokeStyle = SIGNAL_COLORS[trackIndex % SIGNAL_COLORS.length]!;
    ctx.lineWidth = 1;
    ctx.beginPath();
    let hasPreviousPoint = false;

    for (let x = 0; x < width; x += 1) {
      const bucketStartTime =
        view.viewStart + x / view.pxPerMs + signalWindowOffsetMs;
      const bucketEndTime =
        view.viewStart + (x + 1) / view.pxPerMs + signalWindowOffsetMs;
      const bucketStart = Math.max(
        startIndex,
        lowerBound(parsed.timestamps, bucketStartTime),
      );
      const bucketEnd = Math.min(
        endIndex,
        lowerBound(parsed.timestamps, bucketEndTime),
      );

      if (bucketStart >= bucketEnd) {
        continue;
      }

      const bucketSize = bucketEnd - bucketStart;
      const stride = Math.max(1, Math.ceil(bucketSize / MAX_BUCKET_SAMPLES));
      let bucketMin = Number.POSITIVE_INFINITY;
      let bucketMax = Number.NEGATIVE_INFINITY;

      for (let index = bucketStart; index < bucketEnd; index += stride) {
        const value = values[index];
        if (value === undefined || !Number.isFinite(value)) {
          continue;
        }
        bucketMin = Math.min(bucketMin, value);
        bucketMax = Math.max(bucketMax, value);
      }

      if (Number.isFinite(bucketMin) && Number.isFinite(bucketMax)) {
        const centerY = valueToY((bucketMin + bucketMax) / 2);
        if (hasPreviousPoint) {
          ctx.lineTo(x + 0.5, centerY);
        } else {
          ctx.moveTo(x + 0.5, centerY);
          hasPreviousPoint = true;
        }

        if (bucketMin !== bucketMax) {
          ctx.moveTo(x + 0.5, valueToY(bucketMin));
          ctx.lineTo(x + 0.5, valueToY(bucketMax));
          ctx.moveTo(x + 0.5, centerY);
        }
      }
    }

    ctx.stroke();

    ctx.font = '10px JetBrains Mono, ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const shortName = signal.name.split('\\').at(-1) ?? signal.name;
    const labelY = trackTop + trackHeight / 2;
    const labelMaxWidth = Math.min(SIGNAL_LABEL_WIDTH, width) - 16;
    ctx.strokeStyle = COLORS.signalLabelOutline;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.strokeText(shortName, 8, labelY, labelMaxWidth);
    ctx.fillStyle = SIGNAL_COLORS[trackIndex % SIGNAL_COLORS.length]!;
    ctx.fillText(shortName, 8, labelY, labelMaxWidth);

    if (markerIsVisible && markerSampleIndex !== null) {
      const markerValue = values[markerSampleIndex];
      if (markerValue !== undefined && Number.isFinite(markerValue)) {
        const markerY = valueToY(markerValue);
        const color = SIGNAL_COLORS[trackIndex % SIGNAL_COLORS.length]!;
        const valueLabel = formatSignalValue(markerValue);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(markerX, markerY, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.background;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = '10px JetBrains Mono, ui-monospace, monospace';
        const textWidth = ctx.measureText(valueLabel).width;
        const labelWidth = textWidth + SIGNAL_VALUE_LABEL_PADDING_X * 2;
        const labelHeight = 16;
        const preferredX = markerX + SIGNAL_VALUE_LABEL_GAP;
        const labelX = Math.max(
          2,
          Math.min(preferredX, width - labelWidth - 2),
        );
        const labelTop = Math.max(
          trackTop + 2,
          Math.min(markerY - labelHeight / 2, trackBottom - labelHeight - 2),
        );

        ctx.fillStyle = COLORS.rulerBackground;
        ctx.fillRect(labelX, labelTop, labelWidth, labelHeight);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(labelX + 0.5, labelTop + 0.5, labelWidth - 1, labelHeight - 1);
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          valueLabel,
          labelX + SIGNAL_VALUE_LABEL_PADDING_X,
          labelTop + labelHeight / 2,
        );
      }
    }
  });

  ctx.restore();
}

function drawPlayhead(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  view: TimelineView,
  currentTime: number,
): void {
  if (currentTime < view.viewStart || currentTime > view.viewEnd) {
    return;
  }

  const x = timeToX(currentTime, view);
  if (x < 0 || x > width) {
    return;
  }

  const roundedX = Math.round(x) + 0.5;

  ctx.strokeStyle = COLORS.playheadGlow;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(roundedX, 0);
  ctx.lineTo(roundedX, height);
  ctx.stroke();

  ctx.strokeStyle = COLORS.playhead;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(roundedX, 0);
  ctx.lineTo(roundedX, height);
  ctx.stroke();

  ctx.fillStyle = COLORS.playhead;
  ctx.beginPath();
  ctx.moveTo(x - 5, 0);
  ctx.lineTo(x + 5, 0);
  ctx.lineTo(x, 7);
  ctx.closePath();
  ctx.fill();
}

export function renderTimeline(options: TimelineRenderOptions): TimelineView {
  const {
    ctx,
    width,
    height,
    visibleRange,
    currentTime,
    parsedSignals,
    signals,
    signalWindowOffsetMs,
  } = options;
  const view = getTimelineView(visibleRange, width);

  ctx.clearRect(0, 0, width, height);
  drawBackground(ctx, width, height);
  drawGrid(ctx, width, height, view);
  drawTicks(ctx, width, view);
  if (parsedSignals) {
    drawSignalTracks(
      ctx,
      width,
      height,
      view,
      parsedSignals,
      signals,
      signalWindowOffsetMs,
      currentTime,
    );
  }
  drawPlayhead(ctx, width, height, view, currentTime);

  return view;
}

export function isNearPlayhead(
  x: number,
  view: TimelineView,
  currentTime: number,
): boolean {
  const playheadX = timeToX(currentTime, view);
  return Math.abs(x - playheadX) <= PLAYHEAD_HIT_WIDTH;
}
