import CsvParserWorker from '@/workers/csvParser.worker?worker';
import type {
  CsvParseProgress,
  CsvParserWorkerInboundMessage,
  CsvParserWorkerOutboundMessage,
  ParsedCsvData,
} from '@/types/csv';

export interface ParseCsvOptions {
  onProgress?: (progress: CsvParseProgress) => void;
}

let activeWorker: Worker | null = null;
let activeParseId = 0;
let rejectActiveParse: ((reason: Error) => void) | null = null;

function terminateActiveWorker(): void {
  if (activeWorker) {
    activeWorker.terminate();
    activeWorker = null;
  }
}

export function cancelCsvParse(): void {
  if (rejectActiveParse) {
    rejectActiveParse(new DOMException('CSV parse cancelled.', 'AbortError'));
    rejectActiveParse = null;
  }

  terminateActiveWorker();
  activeParseId += 1;
}

export function parseCsvFile(
  file: File,
  options?: ParseCsvOptions,
): Promise<ParsedCsvData> {
  if (rejectActiveParse) {
    rejectActiveParse(new DOMException('CSV parse superseded.', 'AbortError'));
    rejectActiveParse = null;
  }

  terminateActiveWorker();
  const parseId = ++activeParseId;

  return new Promise((resolve, reject) => {
    rejectActiveParse = reject;

    const worker = new CsvParserWorker();
    activeWorker = worker;

    worker.onmessage = (
      event: MessageEvent<CsvParserWorkerOutboundMessage>,
    ) => {
      if (parseId !== activeParseId) {
        return;
      }

      const message = event.data;
      switch (message.type) {
        case 'progress':
          options?.onProgress?.({ rowsParsed: message.rowsParsed });
          break;
        case 'complete':
          rejectActiveParse = null;
          activeWorker = null;
          worker.terminate();
          resolve(message.data);
          break;
        case 'error':
          rejectActiveParse = null;
          activeWorker = null;
          worker.terminate();
          reject(new Error(message.message));
          break;
      }
    };

    worker.onerror = (event) => {
      if (parseId !== activeParseId) {
        return;
      }

      rejectActiveParse = null;
      activeWorker = null;
      worker.terminate();
      reject(new Error(event.message || 'CSV parser worker failed.'));
    };

    const payload: CsvParserWorkerInboundMessage = {
      type: 'parse',
      file,
    };
    worker.postMessage(payload);
  });
}
