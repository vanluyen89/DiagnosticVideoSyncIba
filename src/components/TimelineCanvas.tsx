import { useState } from 'react';
import {
  DEFAULT_CANVAS_HEIGHT,
  useTimelineCanvas,
} from '@/hooks/useTimelineCanvas';
import { cn } from '@/utils';

interface TimelineCanvasProps {
  className?: string;
  defaultHeight?: number;
}

export function TimelineCanvas({
  className,
  defaultHeight = DEFAULT_CANVAS_HEIGHT,
}: TimelineCanvasProps) {
  const [canvasHeight, setCanvasHeight] = useState(defaultHeight);
  const {
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
  } = useTimelineCanvas({
    canvasHeight,
    onHeightChange: setCanvasHeight,
  });

  return (
    <div
      ref={containerRef}
      className={cn('relative min-h-0 w-full', className)}
    >
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize timeline"
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        className="absolute inset-x-0 top-0 z-10 flex h-2 -translate-y-1/2 cursor-row-resize items-center justify-center"
      >
        <span className="bg-surface-600 hover:bg-accent-400/70 h-1 w-10 rounded-full transition-colors" />
      </div>

      <canvas
        ref={canvasRef}
        className="border-surface-700 bg-surface-850 block w-full touch-none rounded-md border"
        style={{ height: canvasHeight }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onClick={handleClick}
      />
    </div>
  );
}
