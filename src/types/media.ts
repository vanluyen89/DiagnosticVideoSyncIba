import type { CsvParseStatus, ParsedCsvData } from '@/types/csv';
import type { StoredUploadFile } from '@/types/upload';

export interface AppVideoState {
  file: StoredUploadFile;
  url: string;
}

export interface AppCsvState {
  file: StoredUploadFile;
  parsed: ParsedCsvData | null;
  parseStatus: CsvParseStatus;
  parseError: string | null;
  rowsParsed: number;
}
