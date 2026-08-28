export interface ParsedCsvData {
  timestamps: Float64Array;
  signalNames: string[];
  signalValues: Float64Array[];
  timebase: 'explicit' | 'sample-index';
  absoluteStartTimeIso?: string;
  absoluteStartTimeMs?: number;
}

export interface CsvParseProgress {
  rowsParsed: number;
}

export type CsvParseStatus = 'idle' | 'parsing' | 'ready' | 'error';

export interface CsvParserWorkerParseMessage {
  type: 'parse';
  file: File;
}

export type CsvParserWorkerInboundMessage = CsvParserWorkerParseMessage;

export interface CsvParserWorkerProgressMessage {
  type: 'progress';
  rowsParsed: number;
}

export interface CsvParserWorkerCompleteMessage {
  type: 'complete';
  data: ParsedCsvData;
}

export interface CsvParserWorkerErrorMessage {
  type: 'error';
  message: string;
}

export type CsvParserWorkerOutboundMessage =
  | CsvParserWorkerProgressMessage
  | CsvParserWorkerCompleteMessage
  | CsvParserWorkerErrorMessage;
