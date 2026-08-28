import type { ParsedCsvData } from '@/types/csv';
import type { Signal, SignalKind } from '@/types/signal';

function inferSignalKind(values: Float64Array): SignalKind {
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]!;
    if (value !== 0 && value !== 1) {
      return 'analog';
    }
  }

  return 'boolean';
}

export function buildSignalsFromParsedCsv(parsed: ParsedCsvData): Signal[] {
  return parsed.signalNames.map((name, index) => ({
    id: `signal-${index}`,
    name,
    index,
    kind: inferSignalKind(parsed.signalValues[index] ?? new Float64Array()),
    visible: true,
  }));
}

export function getCsvDurationMs(parsed: ParsedCsvData): number {
  const { timestamps } = parsed;
  if (timestamps.length === 0) {
    return 0;
  }

  return timestamps[timestamps.length - 1]!;
}
