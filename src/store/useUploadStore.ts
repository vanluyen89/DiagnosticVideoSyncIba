import { create } from 'zustand';
import { cancelCsvParse, parseCsvFile } from '@/services/csvParserService';
import { readQuickTimeCreationTimeMs } from '@/services/videoMetadataService';
import {
  canBrowserPlayHevc,
  isHevcVideo,
  transcodeHevcToH264,
} from '@/services/videoTranscodeService';
import { useAppStore } from '@/store/useAppStore';
import type { CsvParseStatus, ParsedCsvData } from '@/types/csv';
import type { StoredUploadFile } from '@/types/upload';

interface UploadState {
  video: StoredUploadFile | null;
  videoUrl: string | null;
  videoPrepareStatus:
    'idle' | 'checking' | 'loading' | 'transcoding' | 'ready' | 'error';
  videoPrepareProgress: number;
  videoPrepareError: string | null;
  csv: StoredUploadFile | null;
  parsedCsv: ParsedCsvData | null;
  csvParseStatus: CsvParseStatus;
  csvParseError: string | null;
  csvRowsParsed: number;
  setVideoFile: (file: File) => void;
  setCsvFile: (file: File) => void;
  clearVideo: () => void;
  clearCsv: () => void;
}

function toStoredFile(
  file: File,
  kind: StoredUploadFile['kind'],
): StoredUploadFile {
  return {
    file,
    name: file.name,
    size: file.size,
    kind,
  };
}

function revokeUrl(url: string | null) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

let csvParseGeneration = 0;
let videoMetadataGeneration = 0;

export const useUploadStore = create<UploadState>((set) => ({
  video: null,
  videoUrl: null,
  videoPrepareStatus: 'idle',
  videoPrepareProgress: 0,
  videoPrepareError: null,
  csv: null,
  parsedCsv: null,
  csvParseStatus: 'idle',
  csvParseError: null,
  csvRowsParsed: 0,

  setVideoFile: (file) => {
    const generation = ++videoMetadataGeneration;
    const startTimePromise = readQuickTimeCreationTimeMs(file).catch(
      () => null,
    );
    set((state) => {
      revokeUrl(state.videoUrl);
      const storedFile = toStoredFile(file, 'video');
      useAppStore.getState().clearVideo();
      return {
        video: storedFile,
        videoUrl: null,
        videoPrepareStatus: 'checking',
        videoPrepareProgress: 0,
        videoPrepareError: null,
      };
    });

    void isHevcVideo(file)
      .then(async (isHevc) => {
        if (generation !== videoMetadataGeneration) return;

        let playableVideo: Blob = file;
        if (isHevc && !canBrowserPlayHevc()) {
          playableVideo = await transcodeHevcToH264(
            file,
            (progress) => {
              if (generation === videoMetadataGeneration) {
                set({ videoPrepareProgress: progress });
              }
            },
            (stage) => {
              if (generation === videoMetadataGeneration) {
                set({ videoPrepareStatus: stage });
              }
            },
          );
        }

        if (generation !== videoMetadataGeneration) return;
        const videoUrl = URL.createObjectURL(playableVideo);
        const storedFile = toStoredFile(file, 'video');
        const startTimeMs = await startTimePromise;
        if (generation !== videoMetadataGeneration) {
          URL.revokeObjectURL(videoUrl);
          return;
        }
        set({
          videoUrl,
          videoPrepareStatus: 'ready',
          videoPrepareProgress: 1,
        });
        const appStore = useAppStore.getState();
        appStore.setVideo(storedFile, videoUrl);
        appStore.setVideoStartTime(startTimeMs);
      })
      .catch((error: unknown) => {
        if (generation !== videoMetadataGeneration) return;
        set({
          videoUrl: null,
          videoPrepareStatus: 'error',
          videoPrepareError:
            error instanceof Error
              ? error.message
              : typeof error === 'string'
                ? error
                : 'Failed to prepare this video for playback.',
        });
      });
  },

  setCsvFile: (file) => {
    const generation = ++csvParseGeneration;
    const storedFile = toStoredFile(file, 'csv');

    set({
      csv: storedFile,
      parsedCsv: null,
      csvParseStatus: 'parsing',
      csvParseError: null,
      csvRowsParsed: 0,
    });
    useAppStore.getState().setCsvFile(storedFile);

    void parseCsvFile(file, {
      onProgress: ({ rowsParsed }) => {
        if (generation !== csvParseGeneration) {
          return;
        }

        set({ csvRowsParsed: rowsParsed });
        useAppStore.getState().setCsvParseProgress(rowsParsed);
      },
    })
      .then((parsedCsv) => {
        if (generation !== csvParseGeneration) {
          return;
        }

        set({
          parsedCsv,
          csvParseStatus: 'ready',
          csvParseError: null,
          csvRowsParsed: parsedCsv.timestamps.length,
        });
        useAppStore.getState().setCsvParsed(parsedCsv);
      })
      .catch((error: unknown) => {
        if (generation !== csvParseGeneration) {
          return;
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        const message =
          error instanceof Error ? error.message : 'Failed to parse CSV file.';

        set({
          parsedCsv: null,
          csvParseStatus: 'error',
          csvParseError: message,
        });
        useAppStore.getState().setCsvParseError(message);
      });
  },

  clearVideo: () =>
    set((state) => {
      videoMetadataGeneration += 1;
      revokeUrl(state.videoUrl);
      useAppStore.getState().clearVideo();
      return {
        video: null,
        videoUrl: null,
        videoPrepareStatus: 'idle',
        videoPrepareProgress: 0,
        videoPrepareError: null,
      };
    }),

  clearCsv: () => {
    csvParseGeneration += 1;
    cancelCsvParse();
    set({
      csv: null,
      parsedCsv: null,
      csvParseStatus: 'idle',
      csvParseError: null,
      csvRowsParsed: 0,
    });
    useAppStore.getState().clearCsv();
  },
}));
