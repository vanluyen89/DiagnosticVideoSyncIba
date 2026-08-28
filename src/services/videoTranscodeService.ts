import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import coreUrl from '@ffmpeg/core?url';
import wasmUrl from '@ffmpeg/core/wasm?url';

const SCAN_SIZE = 8 * 1024 * 1024;
const HEVC_MARKERS = ['hvc1', 'hev1'];
const LOAD_TIMEOUT_MS = 90_000;

let ffmpegPromise: Promise<FFmpeg> | null = null;

export function canBrowserPlayHevc(): boolean {
  const video = document.createElement('video');
  return Boolean(video.canPlayType('video/mp4; codecs="hvc1"'));
}

async function containsHevcMarker(blob: Blob): Promise<boolean> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const decoder = new TextDecoder('latin1');
  const text = decoder.decode(bytes);
  return HEVC_MARKERS.some((marker) => text.includes(marker));
}

export async function isHevcVideo(file: File): Promise<boolean> {
  const head = file.slice(0, Math.min(file.size, SCAN_SIZE));
  if (await containsHevcMarker(head)) return true;

  if (file.size > SCAN_SIZE) {
    return containsHevcMarker(file.slice(Math.max(0, file.size - SCAN_SIZE)));
  }

  return false;
}

async function getFfmpeg(): Promise<FFmpeg> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const ffmpeg = new FFmpeg();
      await Promise.race([
        ffmpeg.load({ coreURL: coreUrl, wasmURL: wasmUrl }),
        new Promise<never>((_, reject) => {
          window.setTimeout(
            () => reject(new Error('The HEVC converter could not be loaded.')),
            LOAD_TIMEOUT_MS,
          );
        }),
      ]);
      return ffmpeg;
    })().catch((error: unknown) => {
      ffmpegPromise = null;
      throw error;
    });
  }

  return ffmpegPromise;
}

export async function transcodeHevcToH264(
  file: File,
  onProgress: (progress: number) => void,
  onStage: (stage: 'loading' | 'transcoding') => void,
): Promise<Blob> {
  onStage('loading');
  const ffmpeg = await getFfmpeg();
  onStage('transcoding');
  const handleProgress = ({ progress }: { progress: number }) =>
    onProgress(Math.max(0, Math.min(1, progress)));
  ffmpeg.on('progress', handleProgress);
  const inputName = 'input.mov';
  const outputName = 'output.mp4';

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    const exitCode = await ffmpeg.exec([
      '-i',
      inputName,
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-crf',
      '23',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-movflags',
      '+faststart',
      outputName,
    ]);

    if (exitCode !== 0) {
      throw new Error(`FFmpeg exited with code ${exitCode}.`);
    }

    const output = await ffmpeg.readFile(outputName);
    if (typeof output === 'string') {
      throw new Error('FFmpeg returned an invalid video output.');
    }
    return new Blob([new Uint8Array(output)], { type: 'video/mp4' });
  } finally {
    ffmpeg.off('progress', handleProgress);
    await Promise.allSettled([
      ffmpeg.deleteFile(inputName),
      ffmpeg.deleteFile(outputName),
    ]);
  }
}
