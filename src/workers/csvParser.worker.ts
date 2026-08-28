import type {
  CsvParserWorkerInboundMessage,
  CsvParserWorkerOutboundMessage,
  ParsedCsvData,
} from '@/types/csv';

const PROGRESS_INTERVAL = 10_000;
const INITIAL_CAPACITY = 65_536;

type FileFormat = 'timestamped-csv' | 'signal-text' | 'iba-iso';

class GrowableFloat64Array {
  private buffer: Float64Array;
  private length = 0;

  constructor(initialCapacity = INITIAL_CAPACITY) {
    this.buffer = new Float64Array(initialCapacity);
  }

  push(value: number): void {
    if (this.length >= this.buffer.length) {
      const next = new Float64Array(this.buffer.length * 2);
      next.set(this.buffer);
      this.buffer = next;
    }
    this.buffer[this.length] = value;
    this.length += 1;
  }

  toArray(): Float64Array {
    return this.buffer.slice(0, this.length);
  }
}

function parseHeader(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) {
    throw new Error('CSV file is missing a header row.');
  }

  const columns = trimmed.split(',').map((column) => column.trim());
  if (columns.length < 2) {
    throw new Error(
      'CSV header must include Timestamp and at least one signal.',
    );
  }

  if (columns[0]?.toLowerCase() !== 'timestamp') {
    throw new Error('CSV header must start with "Timestamp".');
  }

  const signalNames = columns.slice(1);
  if (signalNames.some((name) => !name)) {
    throw new Error('CSV header contains an empty signal name.');
  }

  return signalNames;
}

function parseNumericLine(
  line: string,
  delimiter: ',' | ';',
  expectedColumns: number,
): number[] | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  const parts = trimmed.split(delimiter);
  if (parts.length !== expectedColumns) {
    throw new Error(
      `Expected ${expectedColumns} columns but found ${parts.length}.`,
    );
  }

  const values: number[] = [];
  for (const part of parts) {
    const value = Number(part.trim());
    if (Number.isNaN(value)) {
      throw new Error(`Invalid numeric value "${part.trim()}".`);
    }
    values.push(value);
  }

  return values;
}

function parseNumericParts(parts: string[]): number[] {
  return parts.map((part) => {
    const trimmed = part.trim();
    const value = Number(trimmed);
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid numeric value "${trimmed}".`);
    }
    return value;
  });
}

function postProgress(rowsParsed: number): void {
  const message: CsvParserWorkerOutboundMessage = {
    type: 'progress',
    rowsParsed,
  };
  self.postMessage(message);
}

function postComplete(data: ParsedCsvData): void {
  const transfers = [
    data.timestamps.buffer,
    ...data.signalValues.map((values) => values.buffer),
  ];

  const message: CsvParserWorkerOutboundMessage = {
    type: 'complete',
    data,
  };
  self.postMessage(message, { transfer: transfers });
}

function postError(message: string): void {
  const payload: CsvParserWorkerOutboundMessage = {
    type: 'error',
    message,
  };
  self.postMessage(payload);
}

async function parseCsvFile(file: File): Promise<ParsedCsvData> {
  const reader = file.stream().getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let signalNames: string[] | null = null;
  let timestamps: GrowableFloat64Array | null = null;
  let signalValues: GrowableFloat64Array[] | null = null;
  let rowCount = 0;
  let format: FileFormat | null = null;
  let channelCount: number | null = null;
  let absoluteStartTimeIso: string | undefined;
  let absoluteStartTimeMs: number | undefined;
  let previousTimestampMs = Number.NEGATIVE_INFINITY;

  const processLine = (line: string): void => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    if (!format) {
      if (trimmed.split(',')[0]?.trim().toLowerCase() === 'timestamp') {
        format = 'timestamped-csv';
        signalNames = parseHeader(trimmed);
        timestamps = new GrowableFloat64Array();
        signalValues = signalNames.map(() => new GrowableFloat64Array());
        return;
      }

      const columns = trimmed.split(';').map((value) => value.trim());
      const hasIsoTimeColumn = columns[0]?.toLowerCase() === 'time';
      const channelIds = hasIsoTimeColumn ? columns.slice(1) : columns;
      if (
        channelIds.length === 0 ||
        channelIds.some((value) => !/^\[\d+:\d+\]$/.test(value))
      ) {
        throw new Error(
          'Unsupported signal file. Expected a Timestamp CSV header or an iba channel header such as "Time;[1:703];[1:714]".',
        );
      }

      format = hasIsoTimeColumn ? 'iba-iso' : 'signal-text';
      channelCount = channelIds.length;
      return;
    }

    if ((format === 'signal-text' || format === 'iba-iso') && !signalNames) {
      const columns = trimmed.split(';').map((name) => name.trim());
      if (format === 'iba-iso' && columns[0]?.toLowerCase() !== 'time') {
        throw new Error(
          'iba signal TXT second header row must start with "time".',
        );
      }

      signalNames = format === 'iba-iso' ? columns.slice(1) : columns;
      if (
        signalNames.length !== channelCount ||
        signalNames.some((name) => !name)
      ) {
        throw new Error('Signal TXT contains invalid or missing signal names.');
      }
      timestamps = new GrowableFloat64Array();
      signalValues = signalNames.map(() => new GrowableFloat64Array());
      return;
    }

    if (!signalNames || !timestamps || !signalValues) {
      throw new Error('Signal file is missing a header row.');
    }

    const hasNumericTimestamp = format === 'timestamped-csv';
    const hasIsoTimestamp = format === 'iba-iso';
    let timestampMs: number;
    let values: number[];

    if (hasIsoTimestamp) {
      const parts = trimmed.split(';');
      if (parts.length !== signalNames.length + 1) {
        throw new Error(
          `Expected ${signalNames.length + 1} columns but found ${parts.length}.`,
        );
      }

      const timestampIso = parts[0]!.trim();
      const parsedAbsoluteMs = Date.parse(timestampIso);
      if (!Number.isFinite(parsedAbsoluteMs)) {
        throw new Error(`Invalid ISO timestamp "${timestampIso}".`);
      }
      if (parsedAbsoluteMs < previousTimestampMs) {
        throw new Error('iba signal timestamps must be in ascending order.');
      }

      absoluteStartTimeIso ??= timestampIso;
      absoluteStartTimeMs ??= parsedAbsoluteMs;
      previousTimestampMs = parsedAbsoluteMs;
      timestampMs = parsedAbsoluteMs - absoluteStartTimeMs;
      values = parseNumericParts(parts.slice(1));
    } else {
      const parsedValues = parseNumericLine(
        trimmed,
        hasNumericTimestamp ? ',' : ';',
        signalNames.length + (hasNumericTimestamp ? 1 : 0),
      );
      if (!parsedValues) {
        return;
      }
      timestampMs = hasNumericTimestamp ? parsedValues[0]! : rowCount;
      values = hasNumericTimestamp ? parsedValues.slice(1) : parsedValues;
    }

    timestamps.push(timestampMs);
    for (let index = 0; index < signalNames.length; index += 1) {
      signalValues[index]!.push(values[index]!);
    }

    rowCount += 1;
    if (rowCount % PROGRESS_INTERVAL === 0) {
      postProgress(rowCount);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    let newlineIndex = buffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      processLine(line);
      newlineIndex = buffer.indexOf('\n');
    }
  }

  buffer += decoder.decode();
  if (buffer.length > 0) {
    processLine(buffer);
  }

  const parsedTimestamps = timestamps as GrowableFloat64Array | null;
  const parsedSignalValues = signalValues as GrowableFloat64Array[] | null;
  const parsedSignalNames = signalNames as string[] | null;

  if (
    !format ||
    !parsedTimestamps ||
    !parsedSignalValues ||
    !parsedSignalNames ||
    rowCount === 0
  ) {
    throw new Error('Signal file does not contain any data rows.');
  }

  if (rowCount % PROGRESS_INTERVAL !== 0) {
    postProgress(rowCount);
  }

  return {
    timestamps: parsedTimestamps.toArray(),
    signalNames: parsedSignalNames,
    signalValues: parsedSignalValues.map((values) => values.toArray()),
    timebase: format === 'signal-text' ? 'sample-index' : 'explicit',
    absoluteStartTimeIso,
    absoluteStartTimeMs,
  };
}

self.onmessage = (event: MessageEvent<CsvParserWorkerInboundMessage>) => {
  const message = event.data;
  if (message.type !== 'parse') {
    return;
  }

  void parseCsvFile(message.file)
    .then(postComplete)
    .catch((error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to parse CSV file.';
      postError(errorMessage);
    });
};

export {};
