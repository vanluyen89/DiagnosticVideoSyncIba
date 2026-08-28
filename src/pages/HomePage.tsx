import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUploadStore } from '@/store/useUploadStore';
import {
  formatFileSize,
  getAcceptAttribute,
  isValidUploadFile,
} from '@/utils/fileValidation';
import { cn } from '@/utils';
import type { StoredUploadFile, UploadFileKind } from '@/types/upload';

interface LargeDropZoneProps {
  kind: UploadFileKind;
  title: string;
  hint: string;
  storedFile: StoredUploadFile | null;
  onSelect: (file: File) => void;
  onClear: () => void;
}

function LargeDropZone({
  kind,
  title,
  hint,
  storedFile,
  onSelect,
  onClear,
}: LargeDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!isValidUploadFile(file, kind)) {
        setError(
          kind === 'video'
            ? 'Please select an MP4 or MOV file.'
            : 'Please select a CSV or TXT file.',
        );
        return;
      }
      setError(null);
      onSelect(file);
    },
    [kind, onSelect],
  );

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files[0]);
  };

  return (
    <div>
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
          'group relative flex min-h-52 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed px-6 py-8 text-center transition-all duration-200',
          isDragging
            ? 'border-accent-400 bg-accent-400/10 scale-[1.01] shadow-[0_0_36px_rgba(34,211,238,0.12)]'
            : 'border-surface-600 bg-surface-950/60 hover:border-accent-400/60 hover:bg-accent-400/5',
          storedFile && 'border-solid border-emerald-400/40 bg-emerald-400/5',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={getAcceptAttribute(kind)}
          className="hidden"
          onChange={handleInputChange}
        />

        {storedFile ? (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>
            </span>
            <p className="mt-4 max-w-full truncate font-mono text-sm font-semibold text-slate-100">
              {storedFile.name}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-500">
              {formatFileSize(storedFile.size)} · Ready
            </p>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onClear();
              }}
              className="mt-4 rounded-md px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-red-400/10 hover:text-red-400"
            >
              Remove file
            </button>
          </>
        ) : (
          <>
            <span className="border-surface-600 bg-surface-850 group-hover:border-accent-400/30 group-hover:text-accent-400 flex h-12 w-12 items-center justify-center rounded-xl border text-slate-400 transition-colors">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 16V4" />
                <path d="m7 9 5-5 5 5" />
                <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
              </svg>
            </span>
            <h4 className="mt-4 text-base font-semibold text-slate-100">
              {title}
            </h4>
            <p className="mt-1 text-sm text-slate-400">Drop your file here</p>
            <p className="mt-1 text-xs text-slate-600">
              or click to browse · {hint}
            </p>
          </>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const video = useUploadStore((state) => state.video);
  const csv = useUploadStore((state) => state.csv);
  const setVideoFile = useUploadStore((state) => state.setVideoFile);
  const setCsvFile = useUploadStore((state) => state.setCsvFile);
  const clearVideo = useUploadStore((state) => state.clearVideo);
  const clearCsv = useUploadStore((state) => state.clearCsv);

  useEffect(() => {
    if (video && csv) navigate('/overview');
  }, [csv, navigate, video]);

  return (
    <main className="bg-surface-950 relative min-h-0 flex-1 overflow-y-auto">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-accent-500/8 absolute top-[-16rem] left-1/2 h-[34rem] w-[48rem] -translate-x-1/2 rounded-full blur-3xl" />
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:42px_42px] opacity-[0.025]" />
      </div>

      <div className="relative mx-auto flex min-h-full max-w-6xl flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <div className="border-accent-400/20 bg-accent-400/10 text-accent-400 mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border shadow-[0_0_30px_rgba(34,211,238,0.1)]">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 3v4a5 5 0 0 0 10 0V3" />
              <path d="M4 3h4M14 3h4" />
              <path d="M11 12v2.5a4.5 4.5 0 0 0 9 0V12" />
              <circle cx="20" cy="10.5" r="1.5" />
            </svg>
          </div>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Diagnose with video and signal in sync
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Upload a recording and its iba signal export. Video diagnostic
            aligns both sources on one timeline so you can find the root cause
            faster.
          </p>
        </div>

        <section className="border-surface-700 bg-surface-900/90 mx-auto w-full max-w-4xl rounded-2xl border p-5 shadow-2xl shadow-black/25 backdrop-blur sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">
                Ready to start?
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Add both files to open your diagnostic workspace.
              </p>
            </div>
            <Link
              to="/manual"
              className="group border-accent-300/60 bg-accent-400 text-surface-950 hover:bg-accent-300 focus-visible:ring-accent-400 inline-flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left shadow-[0_0_24px_rgba(34,211,238,0.18)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(34,211,238,0.28)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:outline-none"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950/10">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4.5 w-4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                  <path d="M8 7h8M8 11h6" />
                </svg>
              </span>
              <span>
                <span className="block text-xs font-bold">
                  View setup manual
                </span>
                <span className="mt-0.5 block text-[10px] font-medium text-slate-800/70">
                  Quick start guide
                </span>
              </span>
              <svg
                viewBox="0 0 20 20"
                className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 10h12M11 5l5 5-5 5" />
              </svg>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <LargeDropZone
              kind="video"
              title="Upload video"
              hint="MP4 or MOV"
              storedFile={video}
              onSelect={setVideoFile}
              onClear={clearVideo}
            />
            <LargeDropZone
              kind="csv"
              title="Upload signal file"
              hint="CSV or TXT"
              storedFile={csv}
              onSelect={setCsvFile}
              onClear={clearCsv}
            />
          </div>

          <div className="mt-5 rounded-xl border border-emerald-400/25 bg-emerald-400/5 px-4 py-4 shadow-[0_0_30px_rgba(52,211,153,0.05)] sm:px-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3 5 6v5c0 4.6 2.8 8.5 7 10 4.2-1.5 7-5.4 7-10V6l-7-3Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </span>
              <div>
                <h3 className="font-semibold text-emerald-300">
                  Privacy by design
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Every file is processed locally in your browser. Nothing is
                  uploaded to a server, and we never store your data.
                </p>
                <a
                  href="https://github.com/vanluyen89/DiagnosticVideoSyncIba"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
                >
                  Open source on GitHub
                  <svg
                    viewBox="0 0 20 20"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M7 4h9v9M16 4 5 15" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
