import { useCallback, useEffect, useRef } from 'react';
import { useUploadStore } from '@/store/useUploadStore';
import { selectVideoWindowOffset, useAppStore } from '@/store/useAppStore';
import { VideoPlayer } from '@/components/VideoPlayer';
import { UploadPanel } from '@/components/UploadPanel';
import { cn } from '@/utils';
import type { VideoPlayerRef } from '@/types/videoPlayer';

function VideoPlaceholder() {
  return (
    <div className="border-surface-700 bg-surface-900 flex h-full min-h-48 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <span className="text-sm text-slate-400">No video loaded</span>
      <span className="mt-1 text-xs text-slate-600">
        Upload an MP4 or MOV file to preview
      </span>
    </div>
  );
}

export function Workspace() {
  const playerRef = useRef<VideoPlayerRef>(null);
  const videoUrl = useUploadStore((s) => s.videoUrl);
  const currentTimeMs = useAppStore((state) => state.currentTime);
  const isPlaying = useAppStore((state) => state.isPlaying);
  const setCurrentTime = useAppStore((state) => state.setCurrentTime);
  const setIsPlaying = useAppStore((state) => state.setIsPlaying);
  const setVideoDuration = useAppStore((state) => state.setVideoDuration);
  const videoWindowOffsetMs = useAppStore(selectVideoWindowOffset);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    if (isPlaying) {
      void player.play().catch(() => setIsPlaying(false));
    } else {
      player.pause();
    }
  }, [isPlaying, setIsPlaying, videoUrl]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    const targetSeconds = (currentTimeMs + videoWindowOffsetMs) / 1_000;
    if (Math.abs(player.getCurrentTime() - targetSeconds) > 0.15) {
      player.seek(targetSeconds);
    }
  }, [currentTimeMs, videoWindowOffsetMs, videoUrl]);

  const handleVideoTimeUpdate = useCallback(
    (timeSeconds: number) =>
      setCurrentTime(timeSeconds * 1_000 - videoWindowOffsetMs),
    [setCurrentTime, videoWindowOffsetMs],
  );

  return (
    <main className="bg-surface-950 flex min-h-0 flex-1 flex-col overflow-hidden">
      <UploadPanel />

      <div className="m-2 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className={cn('min-h-0 flex-1', !videoUrl && 'flex')}>
          {videoUrl ? (
            <VideoPlayer
              ref={playerRef}
              key={videoUrl}
              src={videoUrl}
              className="h-full min-h-48"
              onTimeUpdate={handleVideoTimeUpdate}
              onDurationChange={(durationSeconds) =>
                setVideoDuration(durationSeconds * 1_000)
              }
              onPlayStateChange={setIsPlaying}
              onLoadedMetadata={() =>
                playerRef.current?.seek(
                  (useAppStore.getState().currentTime + videoWindowOffsetMs) /
                    1_000,
                )
              }
            />
          ) : (
            <VideoPlaceholder />
          )}
        </div>
      </div>
    </main>
  );
}
