import { useCallback, useEffect, useRef } from 'react';
import {
  selectSessionDuration,
  selectSignalWindowOffset,
  useAppStore,
} from '@/store/useAppStore';
import {
  getTimelineView,
  isNearPlayhead,
  MIN_VISIBLE_SPAN_MS,
  renderTimeline,
  xToTime,
} from '@/utils/timelineRenderer';

const MIN_CANVAS_HEIGHT = 80;
const MAX_CANVAS_HEIGHT = 480;
const DEFAULT_CANVAS_HEIGHT = 160;
const ZOOM_WHEEL_FACTOR = 1.12;

type InteractionMode = 'none' | 'pan' | 'scrub' | 'resize';

interface CanvasSize {
  width: number;
  height: number;
  dpr: number;
}

interface UseTimelineCanvasOptions {
  canvasHeight: number;
  onHeightChange: (height: number) => void;
}

function clampHeight(height: number): number {
  return Math.max(MIN_CANVAS_HEIGHT, Math.min(MAX_CANVAS_HEIGHT, height));
}

function clampSpan(spanMs: number, maxSpanMs: number): number {
  return Math.max(MIN_VISIBLE_SPAN_MS, Math.min(maxSpanMs, spanMs));
}

export function useTimelineCanvas({
  canvasHeight,
  onHeightChange,
}: UseTimelineCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<CanvasSize>({ width: 0, height: 0, dpr: 1 });
  const interactionRef = useRef({
    mode: 'none' as InteractionMode,
    lastX: 0,
    lastY: 0,
    didMove: false,
    resizeStartY: 0,
    resizeStartHeight: DEFAULT_CANVAS_HEIGHT,
  });
  const renderRef = useRef<(() => void) | null>(null);

  const visibleRange = useAppStore((state) => state.visibleRange);
  const currentTime = useAppStore((state) => state.currentTime);
  const isPlaying = useAppStore((state) => state.isPlaying);
  const parsedSignals = useAppStore((state) => state.csv?.parsed ?? null);
  const signals = useAppStore((state) => state.signals);
  const signalWindowOffsetMs = useAppStore(selectSignalWindowOffset);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const { width, height, dpr } = sizeRef.current;
    if (width <= 0 || height <= 0) {
      return;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderTimeline({
      ctx,
      width,
      height,
      visibleRange,
      currentTime,
      parsedSignals,
      signals,
      signalWindowOffsetMs,
    });
  }, [visibleRange, currentTime, parsedSignals, signals, signalWindowOffsetMs]);

  renderRef.current = render;

  useEffect(() => {
    render();
  }, [render, canvasHeight]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    let frameId = 0;
    const tick = () => {
      renderRef.current?.();
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [isPlaying]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      return;
    }

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(Math.floor(rect.width), 1);
      const height = Math.max(Math.floor(canvasHeight), 1);

      sizeRef.current = { width, height, dpr };
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      renderRef.current?.();
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, [canvasHeight]);

  const zoomAt = useCallback((anchorX: number, factor: number) => {
    const { width } = sizeRef.current;
    if (width <= 0) {
      return;
    }

    const state = useAppStore.getState();
    const sessionDuration = selectSessionDuration(state);
    const maxSpanMs = Math.max(sessionDuration * 1.5, MIN_VISIBLE_SPAN_MS * 10);
    const view = getTimelineView(state.visibleRange, width);
    const anchorTime = xToTime(anchorX, view);
    const nextSpan = clampSpan(view.spanMs / factor, maxSpanMs);
    const anchorRatio = (anchorTime - view.viewStart) / view.spanMs;
    const nextStart = Math.max(0, anchorTime - anchorRatio * nextSpan);

    state.setVisibleRange({
      start: nextStart,
      end: nextStart + nextSpan,
    });

    if (factor > 1) {
      state.zoomIn(factor);
    } else {
      state.zoomOut(1 / factor);
    }

    renderRef.current?.();
  }, []);

  const panByPixels = useCallback((deltaX: number) => {
    const { width } = sizeRef.current;
    if (width <= 0 || deltaX === 0) {
      return;
    }

    const state = useAppStore.getState();
    const view = getTimelineView(state.visibleRange, width);
    const deltaMs = -deltaX / view.pxPerMs;
    state.panVisibleRange(deltaMs);
    renderRef.current?.();
  }, []);

  const seekAt = useCallback((x: number) => {
    const { width } = sizeRef.current;
    if (width <= 0) {
      return;
    }

    const state = useAppStore.getState();
    const view = getTimelineView(state.visibleRange, width);
    state.seekTo(xToTime(x, view));
    renderRef.current?.();
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const state = useAppStore.getState();
      const view = getTimelineView(state.visibleRange, rect.width);

      if (event.button === 0 && isNearPlayhead(x, view, state.currentTime)) {
        interactionRef.current = {
          ...interactionRef.current,
          mode: 'scrub',
          lastX: x,
          lastY: 0,
          didMove: false,
        };
      } else if (event.button === 0 || event.button === 1) {
        interactionRef.current = {
          ...interactionRef.current,
          mode: 'pan',
          lastX: x,
          lastY: 0,
          didMove: false,
        };
      } else {
        return;
      }

      canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const { mode, lastX } = interactionRef.current;
      const canvas = canvasRef.current;
      if (!canvas || mode === 'none') {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;

      if (mode === 'pan') {
        if (Math.abs(x - lastX) > 0) {
          interactionRef.current.didMove = true;
        }
        panByPixels(x - lastX);
        interactionRef.current.lastX = x;
        return;
      }

      if (mode === 'scrub') {
        interactionRef.current.didMove = true;
        seekAt(x);
        interactionRef.current.lastX = x;
      }
    },
    [panByPixels, seekAt],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      interactionRef.current.mode = 'none';
      canvasRef.current?.releasePointerCapture(event.pointerId);
    },
    [],
  );

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;

      if (event.ctrlKey || event.metaKey) {
        const factor =
          event.deltaY < 0 ? ZOOM_WHEEL_FACTOR : 1 / ZOOM_WHEEL_FACTOR;
        zoomAt(x, factor);
        return;
      }

      const deltaX =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      panByPixels(deltaX * 0.5);
    },
    [panByPixels, zoomAt],
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (interactionRef.current.didMove) {
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      seekAt(event.clientX - rect.left);
    },
    [seekAt],
  );

  const handleResizePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      interactionRef.current = {
        ...interactionRef.current,
        mode: 'resize',
        resizeStartY: event.clientY,
        resizeStartHeight: canvasHeight,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [canvasHeight],
  );

  const handleResizePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (interactionRef.current.mode !== 'resize') {
        return;
      }

      const deltaY = event.clientY - interactionRef.current.resizeStartY;
      onHeightChange(
        clampHeight(interactionRef.current.resizeStartHeight - deltaY),
      );
    },
    [onHeightChange],
  );

  const handleResizePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      interactionRef.current.mode = 'none';
      event.currentTarget.releasePointerCapture(event.pointerId);
    },
    [],
  );

  return {
    canvasRef,
    containerRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    handleClick,
    handleResizePointerDown,
    handleResizePointerMove,
    handleResizePointerUp,
    panByPixels,
    zoomAt,
    seekAt,
  };
}

export { DEFAULT_CANVAS_HEIGHT, MAX_CANVAS_HEIGHT, MIN_CANVAS_HEIGHT };
