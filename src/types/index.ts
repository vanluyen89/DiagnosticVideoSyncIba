export type {
  PlaybackRate,
  VideoPlayerProps,
  VideoPlayerRef,
} from '@/types/videoPlayer';
export { PLAYBACK_RATES } from '@/types/videoPlayer';

export type { StoredUploadFile, UploadFileKind } from '@/types/upload';

export type {
  CsvParseProgress,
  CsvParseStatus,
  ParsedCsvData,
} from '@/types/csv';

export type { Marker } from '@/types/marker';
export type { AppCsvState, AppVideoState } from '@/types/media';
export type { Signal, SignalKind } from '@/types/signal';
export type { PlaybackState, VisibleRange } from '@/types/timeline';

export type SystemStatus = 'online' | 'degraded' | 'offline';

export interface TimelineEvent {
  id: string;
  label: string;
  timestamp: number;
  duration: number;
  type: 'info' | 'warning' | 'error' | 'success';
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
}
