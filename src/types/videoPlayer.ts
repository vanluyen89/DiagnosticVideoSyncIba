import type { VideoHTMLAttributes } from 'react';

export const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export type PlaybackRate = (typeof PLAYBACK_RATES)[number];

export interface VideoPlayerRef {
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setPlaybackRate: (rate: number) => void;
  getPlaybackRate: () => number;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  toggleFullscreen: () => Promise<void>;
  isPlaying: () => boolean;
  isFullscreen: () => boolean;
}

export interface VideoPlayerProps extends Omit<
  VideoHTMLAttributes<HTMLVideoElement>,
  'src' | 'className' | 'onTimeUpdate' | 'onDurationChange'
> {
  src: string;
  className?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onPlaybackRateChange?: (rate: number) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}
