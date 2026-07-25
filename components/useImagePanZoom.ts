import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';

type PanOffset = {
  x: number;
  y: number;
};

type ImageTransform = PanOffset & {
  scale: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  startOffset: PanOffset;
};

type ImagePanZoomOptions = {
  minScale?: number;
  maxScale?: number;
  step?: number;
};

type ImageTransformStyle = CSSProperties & {
  '--lightbox-pan-x': string;
  '--lightbox-pan-y': string;
  '--lightbox-zoom-scale': number;
};

const initialTransform: ImageTransform = { scale: 1, x: 0, y: 0 };

/** 管理全屏图片查看器的滚轮缩放、指针拖拽和边界约束。 */
export function useImagePanZoom({ minScale = 0.5, maxScale = 3, step = 0.25 }: ImagePanZoomOptions = {}) {
  const stageElementRef = useRef<HTMLDivElement | null>(null);
  const [stageElement, setStageElement] = useState<HTMLDivElement | null>(null);
  const stageRef = useCallback((node: HTMLDivElement | null) => {
    stageElementRef.current = node;
    setStageElement(node);
  }, []);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [transform, setTransform] = useState<ImageTransform>(initialTransform);
  const [isPanning, setIsPanning] = useState(false);

  const clampOffset = useCallback((scale: number, offset: PanOffset): PanOffset => {
    const stage = stageElementRef.current;
    const image = imageRef.current;
    if (!stage || !image || image.offsetWidth === 0 || image.offsetHeight === 0) {
      return offset;
    }

    const maxX = Math.max(0, (image.offsetWidth * scale - stage.clientWidth) / 2);
    const maxY = Math.max(0, (image.offsetHeight * scale - stage.clientHeight) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, offset.x)),
      y: Math.min(maxY, Math.max(-maxY, offset.y))
    };
  }, []);

  const updateScale = useCallback((nextScale: number | ((current: number) => number), origin?: PanOffset) => {
    setTransform((current) => {
      const requestedScale = typeof nextScale === 'function' ? nextScale(current.scale) : nextScale;
      const scale = Math.min(maxScale, Math.max(minScale, requestedScale));
      const ratio = current.scale === 0 ? 1 : scale / current.scale;
      const nextOffset = origin ? {
        x: origin.x - (origin.x - current.x) * ratio,
        y: origin.y - (origin.y - current.y) * ratio
      } : current;
      const offset = clampOffset(scale, nextOffset);
      return { scale, ...offset };
    });
  }, [clampOffset, maxScale, minScale]);

  const zoomIn = useCallback(() => updateScale((current) => current + step), [step, updateScale]);
  const zoomOut = useCallback(() => updateScale((current) => current - step), [step, updateScale]);
  const resetTransform = useCallback(() => {
    dragRef.current = null;
    setIsPanning(false);
    setTransform(initialTransform);
  }, []);

  const handleWheel = useCallback((event: WheelEvent) => {
    if (event.deltaY === 0) {
      return;
    }

    event.preventDefault();
    const stage = stageElementRef.current;
    const rect = stage?.getBoundingClientRect();
    const origin = rect ? {
      x: event.clientX - (rect.left + rect.width / 2),
      y: event.clientY - (rect.top + rect.height / 2)
    } : undefined;
    updateScale((current) => current + (event.deltaY < 0 ? step : -step), origin);
  }, [step, updateScale]);

  useEffect(() => {
    if (!stageElement) {
      return undefined;
    }

    stageElement.addEventListener('wheel', handleWheel, { passive: false });
    return () => stageElement.removeEventListener('wheel', handleWheel);
  }, [handleWheel, stageElement]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLImageElement>) => {
    if (event.button !== 0 || transform.scale <= 1) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: { x: transform.x, y: transform.y }
    };
    setIsPanning(true);
  }, [transform.scale, transform.x, transform.y]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLImageElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    setTransform((current) => ({
      ...current,
      ...clampOffset(current.scale, {
        x: drag.startOffset.x + event.clientX - drag.startX,
        y: drag.startOffset.y + event.clientY - drag.startY
      })
    }));
  }, [clampOffset]);

  const finishPointer = useCallback((event: ReactPointerEvent<HTMLImageElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setIsPanning(false);
  }, []);

  const imageStyle: ImageTransformStyle = {
    '--lightbox-pan-x': `${transform.x}px`,
    '--lightbox-pan-y': `${transform.y}px`,
    '--lightbox-zoom-scale': transform.scale,
    touchAction: 'none',
    userSelect: 'none'
  };

  return {
    stageRef,
    imageRef,
    imageStyle,
    isPanning,
    maxScale,
    minScale,
    resetTransform,
    zoomIn,
    zoomOut,
    zoomScale: transform.scale,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp: finishPointer,
    handlePointerCancel: finishPointer,
    handleWheel
  };
}
