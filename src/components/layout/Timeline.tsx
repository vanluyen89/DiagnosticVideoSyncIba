import { useState } from 'react';
import { selectSessionDuration, useAppStore } from '@/store/useAppStore';
import { SYNC_OFFSET_MIN, SYNC_OFFSET_MAX } from '@/store/constants';
import { TimelineCanvas } from '@/components/TimelineCanvas';
import { useTimelinePlayback } from '@/hooks/useTimelinePlayback';
import { formatTimeMs } from '@/utils';

export function Timeline() {
  const currentTime = useAppStore((state) => state.currentTime);
  const isPlaying = useAppStore((state) => state.isPlaying);
  const togglePlayback = useAppStore((state) => state.togglePlayback);
  const sessionDuration = useAppStore(selectSessionDuration);
  const offset = useAppStore((state) => state.offset);
  const setOffset = useAppStore((state) => state.setOffset);
  const resetOffset = useAppStore((state) => state.resetOffset);
  const hasSignals = useAppStore((state) => state.signals.length > 0);
  const [offsetDraft, setOffsetDraft] = useState<string | null>(null);

  useTimelinePlayback();

  return (
    <footer className="border-surface-700 bg-surface-900 flex shrink-0 flex-col border-t">
      <div className="border-surface-800 flex flex-wrap items-center gap-3 border-b px-4 py-2">
        <button
          type="button"
          onClick={togglePlayback}
          className="border-surface-600 bg-surface-800 hover:border-accent-500/40 hover:text-accent-400 flex h-7 w-7 items-center justify-center rounded-md border text-slate-300 transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5"
              fill="currentColor"
            >
              <rect x="3" y="2" width="3.5" height="12" rx="0.5" />
              <rect x="9.5" y="2" width="3.5" height="12" rx="0.5" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 16 16"
              className="ml-0.5 h-3.5 w-3.5"
              fill="currentColor"
            >
              <path d="M4 2L14 8L4 14V2Z" />
            </svg>
          )}
        </button>

        <span className="text-accent-400 font-mono text-xs tabular-nums">
          {formatTimeMs(currentTime)}
        </span>
        <span className="text-xs text-slate-600">/</span>
        <span className="font-mono text-xs text-slate-500 tabular-nums">
          {formatTimeMs(sessionDuration)}
        </span>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <label htmlFor="signal-offset">Signal offset (ms)</label>
          <input
            id="signal-offset"
            type="number"
            min={SYNC_OFFSET_MIN}
            max={SYNC_OFFSET_MAX}
            step="any"
            disabled={!hasSignals}
            value={offsetDraft ?? offset}
            onChange={(event) => {
              setOffsetDraft(event.target.value);
              if (
                event.target.value !== '' &&
                event.currentTarget.validity.valid
              ) {
                setOffset(event.currentTarget.valueAsNumber);
              }
            }}
            onBlur={() => {
              if (offsetDraft !== null && offsetDraft.trim() !== '') {
                setOffset(Number(offsetDraft));
              }
              setOffsetDraft(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
            aria-describedby="signal-offset-help"
            className="border-surface-600 bg-surface-800 focus:border-accent-400 h-7 w-24 rounded-md border px-2 font-mono text-slate-200 outline-none disabled:opacity-40"
          />
          <button
            type="button"
            disabled={!hasSignals || offset === 0}
            onClick={() => {
              resetOffset();
              setOffsetDraft(null);
            }}
            className="border-surface-600 hover:text-accent-400 h-7 rounded-md border px-2 disabled:opacity-40"
          >
            Reset
          </button>
          <span id="signal-offset-help" className="text-slate-500">
            + later / − earlier · ±10,000 ms
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3 text-[11px] text-slate-600">
          <span>Drag to pan</span>
          <span>Ctrl + wheel to zoom</span>
        </div>
      </div>

      <div className="px-4 py-3">
        <TimelineCanvas />
      </div>
    </footer>
  );
}
