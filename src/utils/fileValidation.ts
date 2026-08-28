import type { UploadFileKind } from '@/types/upload';

const VIDEO_EXTENSIONS = ['.mp4', '.mov'];
const CSV_EXTENSIONS = ['.csv', '.txt'];

const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime'];
const CSV_MIME_TYPES = ['text/csv', 'application/csv', 'text/plain'];

function getExtension(filename: string): string {
  const index = filename.lastIndexOf('.');
  return index >= 0 ? filename.slice(index).toLowerCase() : '';
}

function matchesKind(file: File, kind: UploadFileKind): boolean {
  const extension = getExtension(file.name);

  if (kind === 'video') {
    return (
      VIDEO_EXTENSIONS.includes(extension) ||
      VIDEO_MIME_TYPES.includes(file.type)
    );
  }

  return (
    CSV_EXTENSIONS.includes(extension) || CSV_MIME_TYPES.includes(file.type)
  );
}

export function isValidUploadFile(file: File, kind: UploadFileKind): boolean {
  return matchesKind(file, kind);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getAcceptAttribute(kind: UploadFileKind): string {
  return kind === 'video'
    ? 'video/mp4,video/quicktime,.mp4,.mov'
    : '.csv,.txt,text/csv,text/plain';
}

export function getUploadKindLabel(kind: UploadFileKind): string {
  return kind === 'video' ? 'MP4 or MOV' : 'CSV or TXT';
}
