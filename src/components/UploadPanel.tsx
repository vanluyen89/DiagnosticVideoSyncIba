import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { useUploadStore } from '@/store/useUploadStore';
import { cn } from '@/utils';
import {
  formatFileSize,
  getAcceptAttribute,
  getUploadKindLabel,
  isValidUploadFile,
} from '@/utils/fileValidation';
import type { StoredUploadFile, UploadFileKind } from '@/types/upload';

interface FileDropZoneProps {
  kind: UploadFileKind;
  storedFile: StoredUploadFile | null;
  onSelect: (file: File) => void;
  onClear: () => void;
}

export function FileDropZone({
  kind,
  storedFile,
  onSelect,
  onClear,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = getUploadKindLabel(kind);
  const accept = getAcceptAttribute(kind);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;

      if (!isValidUploadFile(file, kind)) {
        setError(`Please select a valid ${label} file.`);
        return;
      }

      setError(null);
      onSelect(file);
    },
    [kind, label, onSelect],
  );

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      handleFile(event.target.files?.[0]);
      event.target.value = '';
    },
    [handleFile],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      handleFile(event.dataTransfer.files[0]);
    },
    [handleFile],
  );

  return (
    <div className="min-w-0 flex-1">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={cn(
          'flex h-11 min-w-0 cursor-pointer items-center gap-3 rounded-md border border-dashed px-3 transition-colors',
          isDragging
            ? 'border-accent-400 bg-accent-400/5'
            : 'border-surface-600 bg-surface-850 hover:border-surface-500 hover:bg-surface-800',
          storedFile && 'border-surface-700 border-solid',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleInputChange}
        />

        {storedFile ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="shrink-0 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              {label}
            </span>
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-100">
              {storedFile.name}
            </span>
            <span className="shrink-0 font-mono text-[11px] text-slate-500">
              {formatFileSize(storedFile.size)}
            </span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onClear();
              }}
              className="shrink-0 rounded px-1.5 py-1 text-[11px] text-slate-500 transition-colors hover:bg-red-400/10 hover:text-red-400"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              {label}
            </span>
            <span className="truncate text-xs text-slate-400">
              Drop or click to browse
            </span>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function UploadPanel() {
  const video = useUploadStore((s) => s.video);
  const csv = useUploadStore((s) => s.csv);
  const setVideoFile = useUploadStore((s) => s.setVideoFile);
  const setCsvFile = useUploadStore((s) => s.setCsvFile);
  const clearVideo = useUploadStore((s) => s.clearVideo);
  const clearCsv = useUploadStore((s) => s.clearCsv);
  const videoPrepareStatus = useUploadStore((s) => s.videoPrepareStatus);
  const videoPrepareProgress = useUploadStore((s) => s.videoPrepareProgress);
  const videoPrepareError = useUploadStore((s) => s.videoPrepareError);
  const isConverting =
    videoPrepareStatus === 'loading' || videoPrepareStatus === 'transcoding';
  const conversionProgress = Math.round(videoPrepareProgress * 100);

  return (
    <>
      <section className="border-surface-800 flex shrink-0 flex-col border-b px-3 py-2">
        <div className="flex gap-2">
          <FileDropZone
            kind="video"
            storedFile={video}
            onSelect={setVideoFile}
            onClear={clearVideo}
          />
          <FileDropZone
            kind="csv"
            storedFile={csv}
            onSelect={setCsvFile}
            onClear={clearCsv}
          />
        </div>
        {videoPrepareStatus === 'checking' && (
          <p className="mt-2 text-xs text-slate-400">Checking video codec…</p>
        )}
        {videoPrepareStatus === 'error' && videoPrepareError && (
          <p className="mt-2 text-xs text-red-400" role="alert">
            Video conversion failed: {videoPrepareError}
          </p>
        )}
      </section>

      {isConverting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-conversion-title"
          aria-describedby="video-conversion-description"
        >
          <div className="border-surface-700 bg-surface-900 w-full max-w-sm rounded-xl border p-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div
                className="border-surface-600 border-t-accent-400 h-10 w-10 shrink-0 animate-spin rounded-full border-[3px]"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <h2
                  id="video-conversion-title"
                  className="text-sm font-semibold text-slate-100"
                >
                  {videoPrepareStatus === 'loading'
                    ? 'Loading HEVC converter…'
                    : `Converting HEVC to H.264… ${conversionProgress}%`}
                </h2>
                <p
                  id="video-conversion-description"
                  className="mt-1 text-xs text-slate-400"
                >
                  Please wait and keep this window open.
                </p>
              </div>
            </div>

            {videoPrepareStatus === 'transcoding' && (
              <div
                className="bg-surface-700 mt-5 h-1.5 overflow-hidden rounded-full"
                role="progressbar"
                aria-label="Video conversion progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={conversionProgress}
              >
                <div
                  className="bg-accent-400 h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${conversionProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
