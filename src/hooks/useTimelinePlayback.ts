import { useEffect } from 'react';
import { selectSessionDuration, useAppStore } from '@/store/useAppStore';

const TICK_MS = 100;

export function useTimelinePlayback() {
  const isPlaying = useAppStore((state) => state.isPlaying);
  const hasVideo = useAppStore((state) => state.video !== null);

  useEffect(() => {
    if (!isPlaying || hasVideo) {
      return;
    }

    const interval = window.setInterval(() => {
      const state = useAppStore.getState();
      const duration = selectSessionDuration(state);
      const next = state.currentTime + TICK_MS;
      state.setCurrentTime(next >= duration ? 0 : next);
    }, TICK_MS);

    return () => window.clearInterval(interval);
  }, [hasVideo, isPlaying]);
}
