import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { cn, formatTime } from '@/utils';
import {
  PLAYBACK_RATES,
  type PlaybackRate,
  type VideoPlayerProps,
  type VideoPlayerRef,
} from '@/types/videoPlayer';
import { showCoffeePopup } from '@/utils/coffeePopup';

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" className="ml-0.5 h-3.5 w-3.5" fill="currentColor">
      <path d="M4 2L14 8L4 14V2Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
      <rect x="3" y="2" width="3.5" height="12" rx="0.5" />
      <rect x="9.5" y="2" width="3.5" height="12" rx="0.5" />
    </svg>
  );
}

function FullscreenIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          d="M5 9H2V12M11 9H14V12M11 7H14V4M5 7H2V4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        d="M2 6V2H6M10 2H14V6M14 10V14H10M6 14H2V10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ControlButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'border-surface-600 bg-surface-800 hover:border-accent-500/40 hover:text-accent-400 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-slate-300 transition-colors',
        className,
      )}
    >
      {children}
    </button>
  );
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  function VideoPlayer(
    {
      src,
      className,
      onTimeUpdate,
      onDurationChange,
      onPlayStateChange,
      onPlaybackRateChange,
      onFullscreenChange,
      onPlay,
      onPause,
      onLoadedMetadata,
      onEnded,
      onError,
      ...videoProps
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const seekTrackRef = useRef<HTMLDivElement>(null);
    const hasShownCoffeePopup = useRef(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRateState] = useState<PlaybackRate>(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSeeking, setIsSeeking] = useState(false);
    const [mediaError, setMediaError] = useState<string | null>(null);

    const getVideo = useCallback(() => videoRef.current, []);

    const play = useCallback(async () => {
      const video = getVideo();
      if (!video) return;
      try {
        await video.play();
      } catch (error) {
        const message =
          error instanceof DOMException && error.name === 'NotSupportedError'
            ? 'This browser cannot decode the video codec. iPhone MOV files recorded as HEVC must be converted to H.264 first.'
            : 'The video could not be played.';
        setMediaError(message);
        throw error;
      }
    }, [getVideo]);

    const pause = useCallback(() => {
      getVideo()?.pause();
    }, [getVideo]);

    const seek = useCallback(
      (time: number) => {
        const video = getVideo();
        if (!video || !Number.isFinite(video.duration)) return;
        const clamped = Math.max(0, Math.min(time, video.duration));
        video.currentTime = clamped;
        setCurrentTime(clamped);
        onTimeUpdate?.(clamped);
      },
      [getVideo, onTimeUpdate],
    );

    const getCurrentTime = useCallback(
      () => getVideo()?.currentTime ?? 0,
      [getVideo],
    );

    const getDuration = useCallback(
      () => getVideo()?.duration ?? 0,
      [getVideo],
    );

    const setPlaybackRate = useCallback(
      (rate: number) => {
        const video = getVideo();
        if (!video) return;
        video.playbackRate = rate;
        setPlaybackRateState(rate as PlaybackRate);
        onPlaybackRateChange?.(rate);
      },
      [getVideo, onPlaybackRateChange],
    );

    const getPlaybackRate = useCallback(
      () => getVideo()?.playbackRate ?? 1,
      [getVideo],
    );

    const enterFullscreen = useCallback(async () => {
      const container = containerRef.current;
      if (!container) return;
      await container.requestFullscreen();
    }, []);

    const exitFullscreen = useCallback(async () => {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    }, []);

    const toggleFullscreen = useCallback(async () => {
      if (document.fullscreenElement) {
        await exitFullscreen();
      } else {
        await enterFullscreen();
      }
    }, [enterFullscreen, exitFullscreen]);

    useImperativeHandle(
      ref,
      () => ({
        play,
        pause,
        seek,
        getCurrentTime,
        getDuration,
        setPlaybackRate,
        getPlaybackRate,
        enterFullscreen,
        exitFullscreen,
        toggleFullscreen,
        isPlaying: () => isPlaying,
        isFullscreen: () => isFullscreen,
      }),
      [
        play,
        pause,
        seek,
        getCurrentTime,
        getDuration,
        setPlaybackRate,
        getPlaybackRate,
        enterFullscreen,
        exitFullscreen,
        toggleFullscreen,
        isPlaying,
        isFullscreen,
      ],
    );

    const handlePlayState = useCallback(
      (playing: boolean) => {
        setIsPlaying(playing);
        onPlayStateChange?.(playing);
      },
      [onPlayStateChange],
    );

    const handleTimeUpdate = useCallback(() => {
      const video = getVideo();
      if (!video || isSeeking) return;
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime);
    }, [getVideo, isSeeking, onTimeUpdate]);

    const handleLoadedMetadata = useCallback(() => {
      const video = getVideo();
      if (!video) return;
      setMediaError(null);
      setDuration(video.duration);
      onDurationChange?.(video.duration);
    }, [getVideo, onDurationChange]);

    const handleSeekFromPointer = useCallback(
      (clientX: number) => {
        const track = seekTrackRef.current;
        const video = getVideo();
        if (!track || !video || !Number.isFinite(duration) || duration <= 0)
          return;

        const rect = track.getBoundingClientRect();
        const ratio = Math.max(
          0,
          Math.min(1, (clientX - rect.left) / rect.width),
        );
        seek(ratio * duration);
      },
      [duration, getVideo, seek],
    );

    const handleSeekPointerDown = useCallback(
      (event: PointerEvent<HTMLDivElement>) => {
        setIsSeeking(true);
        event.currentTarget.setPointerCapture(event.pointerId);
        handleSeekFromPointer(event.clientX);
      },
      [handleSeekFromPointer],
    );

    const handleSeekPointerMove = useCallback(
      (event: PointerEvent<HTMLDivElement>) => {
        if (!isSeeking) return;
        handleSeekFromPointer(event.clientX);
      },
      [handleSeekFromPointer, isSeeking],
    );

    const handleSeekPointerUp = useCallback(
      (event: PointerEvent<HTMLDivElement>) => {
        if (!isSeeking) return;
        setIsSeeking(false);
        event.currentTarget.releasePointerCapture(event.pointerId);
      },
      [isSeeking],
    );

    const togglePlayPause = useCallback(async () => {
      if (isPlaying) {
        pause();
      } else {
        await play().catch(() => undefined);
      }
    }, [isPlaying, pause, play]);

    useEffect(() => {
      const handleFullscreenChange = () => {
        const active = document.fullscreenElement === containerRef.current;
        setIsFullscreen(active);
        onFullscreenChange?.(active);
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () =>
        document.removeEventListener(
          'fullscreenchange',
          handleFullscreenChange,
        );
    }, [onFullscreenChange]);

    useEffect(() => {
      if (!isPlaying || isSeeking) {
        return;
      }

      let frameId = 0;
      const updateFromVideoClock = () => {
        const video = getVideo();
        if (video) {
          setCurrentTime(video.currentTime);
          onTimeUpdate?.(video.currentTime);
        }
        frameId = window.requestAnimationFrame(updateFromVideoClock);
      };

      frameId = window.requestAnimationFrame(updateFromVideoClock);
      return () => window.cancelAnimationFrame(frameId);
    }, [getVideo, isPlaying, isSeeking, onTimeUpdate]);

    useEffect(() => {
      if (!isPlaying || hasShownCoffeePopup.current) return;

      const timeoutId = window.setTimeout(() => {
        hasShownCoffeePopup.current = true;
        showCoffeePopup();
      }, 5_000);

      return () => window.clearTimeout(timeoutId);
    }, [isPlaying]);

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <div
        ref={containerRef}
        className={cn(
          'border-surface-700 bg-surface-900 flex flex-col overflow-hidden rounded-lg border',
          isFullscreen && 'h-screen w-screen rounded-none border-0',
          className,
        )}
      >
        <div className="relative min-h-0 flex-1 bg-black">
          <video
            ref={videoRef}
            src={src}
            className="h-full w-full object-contain"
            onPlay={(event) => {
              handlePlayState(true);
              onPlay?.(event);
            }}
            onPause={(event) => {
              handlePlayState(false);
              onPause?.(event);
            }}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={(event) => {
              handleLoadedMetadata();
              onLoadedMetadata?.(event);
            }}
            onDurationChange={() => {
              handleLoadedMetadata();
            }}
            onEnded={(event) => {
              handlePlayState(false);
              if (!hasShownCoffeePopup.current) {
                hasShownCoffeePopup.current = true;
                showCoffeePopup();
              }
              onEnded?.(event);
            }}
            onError={(event) => {
              const error = event.currentTarget.error;
              setMediaError(
                error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED ||
                  error?.code === MediaError.MEDIA_ERR_DECODE
                  ? 'This browser cannot decode the video codec. iPhone MOV files recorded as HEVC must be converted to H.264 first.'
                  : 'The video could not be loaded.',
              );
              handlePlayState(false);
              onError?.(event);
            }}
            {...videoProps}
          />
          {mediaError && (
            <div
              role="alert"
              className="absolute inset-0 flex items-center justify-center bg-black/85 p-6 text-center"
            >
              <div className="max-w-md">
                <p className="text-sm font-medium text-red-300">
                  Video format is not supported
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {mediaError}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-surface-700 bg-surface-850 shrink-0 border-t px-3 py-2.5">
          <div
            ref={seekTrackRef}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={currentTime}
            tabIndex={0}
            onPointerDown={handleSeekPointerDown}
            onPointerMove={handleSeekPointerMove}
            onPointerUp={handleSeekPointerUp}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') seek(currentTime + 5);
              if (event.key === 'ArrowLeft') seek(currentTime - 5);
            }}
            className="group bg-surface-700 relative mb-2.5 h-2 cursor-pointer rounded-full"
          >
            <div
              className="bg-accent-500/60 absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${progress}%` }}
            />
            <div
              className="border-accent-400 bg-surface-900 absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 opacity-0 transition-opacity group-hover:opacity-100"
              style={{ left: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-2">
            <ControlButton
              label={isPlaying ? 'Pause' : 'Play'}
              onClick={() => void togglePlayPause()}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </ControlButton>

            <span className="text-accent-400 font-mono text-xs tabular-nums">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs text-slate-600">/</span>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {formatTime(duration)}
            </span>

            <div className="ml-auto flex items-center gap-2">
              <label className="sr-only" htmlFor="playback-rate">
                Playback speed
              </label>
              <select
                id="playback-rate"
                value={playbackRate}
                onChange={(event) =>
                  setPlaybackRate(Number(event.target.value))
                }
                className="border-surface-600 bg-surface-800 hover:border-accent-500/40 focus:border-accent-500/60 h-7 rounded-md border px-2 font-mono text-xs text-slate-300 transition-colors outline-none"
              >
                {PLAYBACK_RATES.map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}x
                  </option>
                ))}
              </select>

              <ControlButton
                label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                onClick={() => void toggleFullscreen()}
              >
                <FullscreenIcon active={isFullscreen} />
              </ControlButton>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
