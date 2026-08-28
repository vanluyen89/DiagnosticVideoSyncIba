import { selectSessionDuration, useAppStore } from '@/store/useAppStore';
import { TimelineCanvas } from '@/components/TimelineCanvas';
import { useTimelinePlayback } from '@/hooks/useTimelinePlayback';
import { formatTimeMs } from '@/utils';

export function Timeline() {
  const currentTime = useAppStore((state) => state.currentTime);
  const isPlaying = useAppStore((state) => state.isPlaying);
  const togglePlayback = useAppStore((state) => state.togglePlayback);
  const sessionDuration = useAppStore(selectSessionDuration);

  useTimelinePlayback();

  return (
    <footer className="border-surface-700 bg-surface-900 flex shrink-0 flex-col border-t">
      <div className="border-surface-800 flex items-center gap-3 border-b px-4 py-2">
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
