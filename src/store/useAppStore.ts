import { create } from 'zustand';
import {
  DEFAULT_VISIBLE_RANGE_MS,
  DEFAULT_ZOOM_LEVEL,
  MARKER_COLORS,
  MAX_ZOOM_LEVEL,
  MIN_ZOOM_LEVEL,
  SYNC_OFFSET_MAX,
  SYNC_OFFSET_MIN,
} from '@/store/constants';
import type { Marker } from '@/types/marker';
import type { AppCsvState, AppVideoState } from '@/types/media';
import type { Signal } from '@/types/signal';
import type { VisibleRange } from '@/types/timeline';
import type { ParsedCsvData } from '@/types/csv';
import type { StoredUploadFile } from '@/types/upload';
import { buildSignalsFromParsedCsv, getCsvDurationMs } from '@/utils/signals';

interface MediaActions {
  setVideo: (file: StoredUploadFile, url: string) => void;
  setVideoDuration: (durationMs: number) => void;
  setVideoStartTime: (startTimeMs: number | null) => void;
  clearVideo: () => void;
  setCsvFile: (file: StoredUploadFile) => void;
  setCsvParseProgress: (rowsParsed: number) => void;
  setCsvParsed: (parsed: ParsedCsvData) => void;
  setCsvParseError: (message: string) => void;
  clearCsv: () => void;
}

interface SignalActions {
  setSignals: (signals: Signal[]) => void;
  setSignalVisibility: (signalId: string, visible: boolean) => void;
  toggleSignalVisibility: (signalId: string) => void;
  showAllSignals: () => void;
  hideAllSignals: () => void;
}

interface MarkerActions {
  addMarker: (marker: Omit<Marker, 'id'> & { id?: string }) => string;
  updateMarker: (
    markerId: string,
    updates: Partial<Omit<Marker, 'id'>>,
  ) => void;
  removeMarker: (markerId: string) => void;
  clearMarkers: () => void;
}

interface SyncActions {
  setOffset: (offset: number) => void;
  resetOffset: () => void;
}

interface PlaybackActions {
  setIsPlaying: (isPlaying: boolean) => void;
  play: () => void;
  pause: () => void;
  togglePlayback: () => void;
  setCurrentTime: (time: number) => void;
  seekTo: (time: number) => void;
}

interface TimelineViewportActions {
  setZoomLevel: (zoomLevel: number) => void;
  zoomIn: (factor?: number) => void;
  zoomOut: (factor?: number) => void;
  setVisibleRange: (range: VisibleRange) => void;
  panVisibleRange: (deltaMs: number) => void;
  fitVisibleRangeToDuration: (durationMs: number) => void;
}

interface SelectionActions {
  selectSignal: (signalId: string | null) => void;
  selectMarker: (markerId: string | null) => void;
}

interface ResetActions {
  resetSession: () => void;
}

export interface AppState {
  video: AppVideoState | null;
  videoDurationMs: number;
  videoStartTimeMs: number | null;
  csv: AppCsvState | null;
  signals: Signal[];
  markers: Marker[];
  offset: number;
  isPlaying: boolean;
  currentTime: number;
  zoomLevel: number;
  visibleRange: VisibleRange;
  selectedSignalId: string | null;
  selectedMarkerId: string | null;
}

export type AppActions = MediaActions &
  SignalActions &
  MarkerActions &
  SyncActions &
  PlaybackActions &
  TimelineViewportActions &
  SelectionActions &
  ResetActions;

export type AppStore = AppState & AppActions;

const initialVisibleRange: VisibleRange = {
  start: 0,
  end: DEFAULT_VISIBLE_RANGE_MS,
};

const initialState: AppState = {
  video: null,
  videoDurationMs: 0,
  videoStartTimeMs: null,
  csv: null,
  signals: [],
  markers: [],
  offset: 0,
  isPlaying: false,
  currentTime: 0,
  zoomLevel: DEFAULT_ZOOM_LEVEL,
  visibleRange: initialVisibleRange,
  selectedSignalId: null,
  selectedMarkerId: null,
};

function clampOffset(offset: number): number {
  return Math.max(SYNC_OFFSET_MIN, Math.min(SYNC_OFFSET_MAX, offset));
}

function clampZoom(zoomLevel: number): number {
  return Math.max(MIN_ZOOM_LEVEL, Math.min(MAX_ZOOM_LEVEL, zoomLevel));
}

function clampTime(time: number, durationMs: number): number {
  if (durationMs <= 0) {
    return Math.max(0, time);
  }

  return Math.max(0, Math.min(durationMs, time));
}

function getSessionDuration(state: AppState): number {
  const csvDuration =
    state.csv?.parsed !== null && state.csv?.parsed !== undefined
      ? getCsvDurationMs(state.csv.parsed)
      : 0;

  const signalStart = state.csv?.parsed?.absoluteStartTimeMs;
  if (
    signalStart !== undefined &&
    state.videoStartTimeMs !== null &&
    csvDuration > 0 &&
    state.videoDurationMs > 0
  ) {
    const commonStart = Math.max(signalStart, state.videoStartTimeMs);
    const commonEnd = Math.min(
      signalStart + csvDuration,
      state.videoStartTimeMs + state.videoDurationMs,
    );
    return Math.max(0, commonEnd - commonStart);
  }

  const mediaDuration = Math.max(csvDuration, state.videoDurationMs);
  return mediaDuration > 0 ? mediaDuration : DEFAULT_VISIBLE_RANGE_MS;
}

function getCommonWindowStartMs(state: AppState): number | null {
  const signalStartTimeMs = state.csv?.parsed?.absoluteStartTimeMs;
  if (state.videoStartTimeMs === null || signalStartTimeMs === undefined) {
    return null;
  }

  return Math.max(state.videoStartTimeMs, signalStartTimeMs);
}

function getVideoWindowOffsetMs(state: AppState): number {
  const commonStart = getCommonWindowStartMs(state);
  return commonStart === null || state.videoStartTimeMs === null
    ? 0
    : commonStart - state.videoStartTimeMs;
}

function getSignalWindowOffsetMs(state: AppState): number {
  const commonStart = getCommonWindowStartMs(state);
  const signalStart = state.csv?.parsed?.absoluteStartTimeMs;
  return commonStart === null || signalStart === undefined
    ? 0
    : commonStart - signalStart;
}

function alignSampleIndexesToVideo(
  parsed: ParsedCsvData,
  videoDurationMs: number,
): ParsedCsvData {
  if (
    parsed.timebase !== 'sample-index' ||
    videoDurationMs <= 0 ||
    parsed.timestamps.length < 2
  ) {
    return parsed;
  }

  const timestamps = new Float64Array(parsed.timestamps.length);
  const sampleIntervalMs = videoDurationMs / (timestamps.length - 1);
  for (let index = 0; index < timestamps.length; index += 1) {
    timestamps[index] = index * sampleIntervalMs;
  }

  return { ...parsed, timestamps };
}

function revokeVideoUrl(video: AppVideoState | null): void {
  if (video?.url) {
    URL.revokeObjectURL(video.url);
  }
}

function createEmptyCsvState(file: StoredUploadFile): AppCsvState {
  return {
    file,
    parsed: null,
    parseStatus: 'parsing',
    parseError: null,
    rowsParsed: 0,
  };
}

function applyParsedCsvState(
  csv: AppCsvState,
  parsed: ParsedCsvData,
  videoDurationMs: number,
): Pick<AppState, 'csv' | 'signals' | 'visibleRange' | 'selectedSignalId'> {
  const alignedParsed = alignSampleIndexesToVideo(parsed, videoDurationMs);
  const signals = buildSignalsFromParsedCsv(alignedParsed);
  const durationMs = Math.max(getCsvDurationMs(alignedParsed), 1_000);

  return {
    csv: {
      ...csv,
      parsed: alignedParsed,
      parseStatus: 'ready',
      parseError: null,
      rowsParsed: alignedParsed.timestamps.length,
    },
    signals,
    visibleRange: { start: 0, end: durationMs },
    selectedSignalId: signals[0]?.id ?? null,
  };
}

function nextMarkerColor(markers: Marker[]): string {
  return (
    MARKER_COLORS[markers.length % MARKER_COLORS.length] ?? MARKER_COLORS[0]
  );
}

export const useAppStore = create<AppStore>((set, get) => ({
  ...initialState,

  setVideo: (file, url) =>
    set((state) => {
      revokeVideoUrl(state.video);
      return {
        video: { file, url },
        videoDurationMs: 0,
        videoStartTimeMs: null,
      };
    }),

  setVideoStartTime: (startTimeMs) =>
    set((state) => {
      const nextState = { ...state, videoStartTimeMs: startTimeMs };
      const duration = getSessionDuration(nextState);
      return {
        videoStartTimeMs: startTimeMs,
        currentTime: 0,
        visibleRange: { start: 0, end: Math.max(duration, 1_000) },
      };
    }),

  setVideoDuration: (durationMs) =>
    set((state) => {
      const normalizedDuration = Math.max(0, durationMs);
      const parsed = state.csv?.parsed;
      if (!state.csv || !parsed) {
        return { videoDurationMs: normalizedDuration };
      }

      const alignedParsed = alignSampleIndexesToVideo(
        parsed,
        normalizedDuration,
      );
      const nextState = {
        ...state,
        videoDurationMs: normalizedDuration,
        csv: { ...state.csv, parsed: alignedParsed },
      };
      const sessionDuration = Math.max(getSessionDuration(nextState), 1_000);

      return {
        videoDurationMs: normalizedDuration,
        csv: { ...state.csv, parsed: alignedParsed },
        visibleRange: { start: 0, end: sessionDuration },
      };
    }),

  clearVideo: () =>
    set((state) => {
      revokeVideoUrl(state.video);
      return {
        video: null,
        videoDurationMs: 0,
        videoStartTimeMs: null,
        isPlaying: false,
        currentTime: 0,
      };
    }),

  setCsvFile: (file) =>
    set({
      csv: createEmptyCsvState(file),
      signals: [],
      selectedSignalId: null,
    }),

  setCsvParseProgress: (rowsParsed) =>
    set((state) => {
      if (!state.csv) {
        return state;
      }

      return {
        csv: {
          ...state.csv,
          parseStatus: 'parsing',
          rowsParsed,
        },
      };
    }),

  setCsvParsed: (parsed) =>
    set((state) => {
      if (!state.csv) {
        return state;
      }

      const parsedState = applyParsedCsvState(
        state.csv,
        parsed,
        state.videoDurationMs,
      );
      const nextState = { ...state, ...parsedState };
      const sessionDuration = Math.max(getSessionDuration(nextState), 1_000);
      return {
        ...parsedState,
        currentTime: 0,
        visibleRange: { start: 0, end: sessionDuration },
      };
    }),

  setCsvParseError: (message) =>
    set((state) => {
      if (!state.csv) {
        return state;
      }

      return {
        csv: {
          ...state.csv,
          parsed: null,
          parseStatus: 'error',
          parseError: message,
        },
        signals: [],
        selectedSignalId: null,
      };
    }),

  clearCsv: () =>
    set({
      csv: null,
      signals: [],
      selectedSignalId: null,
    }),

  setSignals: (signals) => set({ signals }),

  setSignalVisibility: (signalId, visible) =>
    set((state) => ({
      signals: state.signals.map((signal) =>
        signal.id === signalId ? { ...signal, visible } : signal,
      ),
    })),

  toggleSignalVisibility: (signalId) =>
    set((state) => ({
      signals: state.signals.map((signal) =>
        signal.id === signalId
          ? { ...signal, visible: !signal.visible }
          : signal,
      ),
    })),

  showAllSignals: () =>
    set((state) => ({
      signals: state.signals.map((signal) => ({ ...signal, visible: true })),
    })),

  hideAllSignals: () =>
    set((state) => ({
      signals: state.signals.map((signal) => ({ ...signal, visible: false })),
    })),

  addMarker: (markerInput) => {
    const id = markerInput.id ?? crypto.randomUUID();
    const marker: Marker = {
      id,
      name: markerInput.name,
      time: markerInput.time,
      color: markerInput.color ?? nextMarkerColor(get().markers),
    };

    set((state) => ({
      markers: [...state.markers, marker],
      selectedMarkerId: id,
    }));

    return id;
  },

  updateMarker: (markerId, updates) =>
    set((state) => ({
      markers: state.markers.map((marker) =>
        marker.id === markerId ? { ...marker, ...updates } : marker,
      ),
    })),

  removeMarker: (markerId) =>
    set((state) => ({
      markers: state.markers.filter((marker) => marker.id !== markerId),
      selectedMarkerId:
        state.selectedMarkerId === markerId ? null : state.selectedMarkerId,
    })),

  clearMarkers: () =>
    set({
      markers: [],
      selectedMarkerId: null,
    }),

  setOffset: (offset) => set({ offset: clampOffset(offset) }),

  resetOffset: () => set({ offset: 0 }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  play: () => set({ isPlaying: true }),

  pause: () => set({ isPlaying: false }),

  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setCurrentTime: (time) =>
    set((state) => ({
      currentTime: clampTime(time, getSessionDuration(state)),
    })),

  seekTo: (time) =>
    set((state) => ({
      currentTime: clampTime(time, getSessionDuration(state)),
    })),

  setZoomLevel: (zoomLevel) => set({ zoomLevel: clampZoom(zoomLevel) }),

  zoomIn: (factor = 1.25) =>
    set((state) => ({
      zoomLevel: clampZoom(state.zoomLevel * factor),
    })),

  zoomOut: (factor = 1.25) =>
    set((state) => ({
      zoomLevel: clampZoom(state.zoomLevel / factor),
    })),

  setVisibleRange: (range) =>
    set({
      visibleRange: {
        start: Math.max(0, range.start),
        end: Math.max(range.start, range.end),
      },
    }),

  panVisibleRange: (deltaMs) =>
    set((state) => {
      const span = state.visibleRange.end - state.visibleRange.start;
      const nextStart = Math.max(0, state.visibleRange.start + deltaMs);

      return {
        visibleRange: {
          start: nextStart,
          end: nextStart + span,
        },
      };
    }),

  fitVisibleRangeToDuration: (durationMs) =>
    set({
      visibleRange: {
        start: 0,
        end: Math.max(durationMs, 1_000),
      },
    }),

  selectSignal: (signalId) => set({ selectedSignalId: signalId }),

  selectMarker: (markerId) => set({ selectedMarkerId: markerId }),

  resetSession: () =>
    set((state) => {
      revokeVideoUrl(state.video);
      return { ...initialState };
    }),
}));

export function selectVisibleSignals(state: AppState): Signal[] {
  return state.signals.filter((signal) => signal.visible);
}

export function selectSelectedSignal(state: AppState): Signal | null {
  if (!state.selectedSignalId) {
    return null;
  }

  return (
    state.signals.find((signal) => signal.id === state.selectedSignalId) ?? null
  );
}

export function selectSelectedMarker(state: AppState): Marker | null {
  if (!state.selectedMarkerId) {
    return null;
  }

  return (
    state.markers.find((marker) => marker.id === state.selectedMarkerId) ?? null
  );
}

export function selectSessionDuration(state: AppState): number {
  return getSessionDuration(state);
}

export function selectSyncedCurrentTime(state: AppState): number {
  return state.currentTime + state.offset;
}

export function selectVideoWindowOffset(state: AppState): number {
  return getVideoWindowOffsetMs(state);
}

export function selectSignalWindowOffset(state: AppState): number {
  return getSignalWindowOffsetMs(state);
}
