import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MAX_SELECTED_SIGNALS, useUploadStore } from '@/store/useUploadStore';
import {
  formatFileSize,
  MAX_SIGNAL_FILE_SIZE_BYTES,
} from '@/utils/fileValidation';

export function SignalImportDialogs() {
  const pending = useUploadStore((state) => state.pendingSignalSelection);
  const sizeError = useUploadStore((state) => state.signalFileSizeError);
  const confirm = useUploadStore((state) => state.confirmSignalSelection);
  const cancel = useUploadStore((state) => state.cancelSignalSelection);
  const dismissSizeError = useUploadStore(
    (state) => state.dismissSignalFileSizeError,
  );
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    setSelected(
      pending
        ? pending.signalNames
            .slice(0, MAX_SELECTED_SIGNALS)
            .map((_, index) => index)
        : [],
    );
  }, [pending]);

  if (!pending && !sizeError) return null;

  if (sizeError) {
    return (
      <Dialog title="Signal file is too large" onClose={dismissSizeError}>
        <p className="text-sm leading-6 text-slate-300">
          To protect this browser tab from freezing, signal files are limited to{' '}
          {formatFileSize(MAX_SIGNAL_FILE_SIZE_BYTES)}. Export a smaller file
          and try again.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Link
            to="/manual"
            onClick={dismissSizeError}
            className="border-surface-600 hover:bg-surface-800 rounded-md border px-3 py-2 text-sm text-slate-200"
          >
            View manual
          </Link>
          <button
            type="button"
            onClick={dismissSizeError}
            className="bg-accent-400 text-surface-950 hover:bg-accent-300 rounded-md px-3 py-2 text-sm font-semibold"
          >
            Close
          </button>
        </div>
      </Dialog>
    );
  }

  const toggle = (index: number) => {
    setSelected((current) => {
      if (current.includes(index)) {
        return current.filter((value) => value !== index);
      }
      if (current.length >= MAX_SELECTED_SIGNALS) return current;
      return [...current, index];
    });
  };

  return (
    <Dialog title="Choose signals to display" onClose={cancel}>
      <p className="text-sm text-slate-300">
        This file contains {pending!.signalNames.length} signals. Select up to{' '}
        {MAX_SELECTED_SIGNALS} to keep the dashboard responsive.
      </p>
      <p className="mt-2 text-xs font-semibold text-slate-400">
        {selected.length} / {MAX_SELECTED_SIGNALS} selected
      </p>
      <div className="border-surface-700 mt-4 max-h-72 overflow-y-auto rounded-lg border p-2">
        {pending!.signalNames.map((name, index) => {
          const checked = selected.includes(index);
          const disabled = !checked && selected.length >= MAX_SELECTED_SIGNALS;
          return (
            <label
              key={`${name}-${index}`}
              className="hover:bg-surface-800 flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-200"
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(index)}
                className="accent-cyan-400"
              />
              <span className="min-w-0 truncate font-mono">{name}</span>
            </label>
          );
        })}
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={cancel}
          className="border-surface-600 hover:bg-surface-800 rounded-md border px-3 py-2 text-sm text-slate-200"
        >
          Cancel import
        </button>
        <button
          type="button"
          disabled={selected.length === 0}
          onClick={() => confirm(selected)}
          className="bg-accent-400 text-surface-950 hover:bg-accent-300 rounded-md px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          Display selected signals
        </button>
      </div>
    </Dialog>
  );
}

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signal-import-dialog-title"
    >
      <div className="border-surface-700 bg-surface-900 w-full max-w-lg rounded-xl border p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2
            id="signal-import-dialog-title"
            className="text-lg font-semibold text-slate-100"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-xl text-slate-500 hover:text-slate-200"
          >
            ×
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
