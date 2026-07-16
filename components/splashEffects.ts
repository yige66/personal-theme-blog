import type { RefObject } from 'react';

type Cleanup = () => void;
type CanvasRef = RefObject<HTMLCanvasElement | null>;
type DivRef = RefObject<HTMLDivElement | null>;

type GlassPoint = {
  x: number;
  y: number;
};

type GlassStroke = GlassPoint[] & {
  w?: number;
};

type GlassTool = 'pen' | 'finger';

type ThermHandle = {
  paint: () => void;
  cleanup: () => void;
};

type GlassWindow = Window & {
  gwToggle?: () => void;
};

type GlassCanvasRefs = {
  slot: DivRef;
  pane: DivRef;
  draw: CanvasRef;
  fog: CanvasRef;
};

type RainRippleRefs = {
  root: DivRef;
  slot: DivRef;
  pane: DivRef;
  ripple: CanvasRef;
  rippleBg: CanvasRef;
  draw: CanvasRef;
};

export function startRainCanvas(containerRef: DivRef): Cleanup | undefined {
  const box = containerRef.current;
  if (!box) {
    return undefined;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return undefined;
  }

  box.appendChild(canvas);
  box.classList.add('rain-visible');

  const dpr = Math.max(1, Math.min(1.35, window.devicePixelRatio || 1));
  const frameIntervalMs = 1000 / 30;
  const random = (min: number, max: number) => min + Math.random() * (max - min);
  const wind = 24;
  const drops: Array<{ z: number; x: number; y: number; v: number; w: number; wf: number }> = [];
  let width = 0;
  let height = 0;
  let last = 0;
  let lastRenderedAt = 0;
  let frame = 0;
  let running = true;

  const reset = (drop: (typeof drops)[number]) => {
    drop.z = random(0.35, 1);
    drop.x = Math.random() * width;
    drop.v = (380 + random(0, 320)) * drop.z;
    drop.y = -random(0.05, 1.2) * drop.v;
    drop.w = 1.8 + drop.z * 0.8;
    drop.wf = random(0.8, 1.2);
  };

  const size = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    drops.length = 0;
    for (let i = 0; i < 45; i += 1) {
      const drop = { z: 0, x: 0, y: 0, v: 0, w: 0, wf: 0 };
      reset(drop);
      drops.push(drop);
    }
  };

  const loop = (time: number) => {
    if (!running) {
      return;
    }

    frame = window.requestAnimationFrame(loop);
    if (time - lastRenderedAt < frameIntervalMs) {
      return;
    }
    lastRenderedAt = time;
    const dt = Math.min(0.05, (time - last) / 1000 || 0.016);
    last = time;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = 'round';

    for (const drop of drops) {
      const drift = wind * drop.z * drop.wf;
      drop.y += drop.v * dt;
      drop.x += drift * dt;
      if (drop.x > width + 30) {
        drop.x -= width + 60;
      }

      const length = Math.min(72, drop.v * 0.1);
      if (drop.y - length > height) {
        reset(drop);
        continue;
      }

      if (drop.y < -40) {
        continue;
      }

      const alpha = 0.18 + 0.26 * drop.z;
      const tailX = drop.x - drift * (length / drop.v);
      const tailY = drop.y - length;
      const gradient = ctx.createLinearGradient(tailX, tailY, drop.x, drop.y);
      gradient.addColorStop(0, 'rgba(200,220,242,0)');
      gradient.addColorStop(0.62, `rgba(208,225,245,${(alpha * 0.55).toFixed(3)})`);
      gradient.addColorStop(1, `rgba(218,232,250,${Math.min(0.5, alpha * 1.15).toFixed(3)})`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = drop.w;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(drop.x, drop.y);
      ctx.stroke();

      ctx.fillStyle = `rgba(224,238,252,${Math.min(0.45, alpha * 0.9).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, drop.w * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  size();
  window.addEventListener('resize', size);
  frame = window.requestAnimationFrame(loop);

  return () => {
    running = false;
    window.cancelAnimationFrame(frame);
    window.removeEventListener('resize', size);
    box.classList.remove('rain-visible');
    canvas.remove();
  };
}

export function startGlassCanvas(refs: GlassCanvasRefs): Cleanup | undefined {
  const slot = refs.slot.current;
  const pane = refs.pane.current;
  const drawCanvas = refs.draw.current;
  const fogCanvas = refs.fog.current;

  if (!slot || !pane || !drawCanvas || !fogCanvas) {
    return undefined;
  }

  const ink = drawCanvas.getContext('2d');
  const fog = fogCanvas.getContext('2d');
  if (!ink || !fog) {
    return undefined;
  }

  const dpr = Math.max(1, Math.min(1.5, window.devicePixelRatio || 1));
  let width = 0;
  let height = 0;
  let tool: GlassTool = 'finger';
  let fogDepth = 1;
  const size = { pen: 3.6, finger: 19 };
  const penMin = 1.4;
  const penMax = 9;
  const fingerMin = 8;
  const fingerMax = 44;
  const inkStrokes: GlassStroke[] = [];
  const wipeStrokes: GlassStroke[] = [];
  const cleanupCallbacks: Cleanup[] = [];
  const toolPen = document.getElementById('gw-tool-pen') as HTMLButtonElement | null;
  const toolFinger = document.getElementById('gw-tool-finger') as HTMLButtonElement | null;
  const clearButton = document.getElementById('gw-clear') as HTMLButtonElement | null;
  const toggleButton = document.getElementById('gw-toggle') as HTMLButtonElement | null;
  let current: { tool: GlassTool; points: GlassStroke } | null = null;
  let fogPaintFrame = 0;
  let brushTherm: ThermHandle | null = null;

  const midpoint = (a: GlassPoint, b: GlassPoint): GlassPoint => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  });

  const tracePath = (ctx: CanvasRenderingContext2D, points: GlassStroke) => {
    ctx.beginPath();
    if (points.length === 1) {
      ctx.moveTo(points[0].x * width, points[0].y * height);
      ctx.lineTo(points[0].x * width + 0.01, points[0].y * height);
      return;
    }

    ctx.moveTo(points[0].x * width, points[0].y * height);
    if (points.length === 2) {
      ctx.lineTo(points[1].x * width, points[1].y * height);
      return;
    }

    const firstMid = midpoint(points[0], points[1]);
    ctx.lineTo(firstMid.x * width, firstMid.y * height);
    for (let i = 1; i < points.length - 1; i += 1) {
      const nextMid = midpoint(points[i], points[i + 1]);
      ctx.quadraticCurveTo(points[i].x * width, points[i].y * height, nextMid.x * width, nextMid.y * height);
    }
    ctx.lineTo(points[points.length - 1].x * width, points[points.length - 1].y * height);
  };

  const inkStyle = (lineWidth = size.pen) => {
    ink.lineCap = 'round';
    ink.lineJoin = 'round';
    ink.strokeStyle = 'rgba(255,255,255,0.78)';
    ink.fillStyle = 'rgba(255,255,255,0.78)';
    ink.lineWidth = lineWidth;
    ink.shadowColor = 'rgba(178,212,255,0.9)';
    ink.shadowBlur = 12;
  };

  const inkDot = (point: GlassPoint, lineWidth = size.pen) => {
    inkStyle(lineWidth);
    ink.beginPath();
    ink.arc(point.x * width, point.y * height, lineWidth * 0.53, 0, Math.PI * 2);
    ink.fill();
  };

  const renderInkStroke = (points: GlassStroke) => {
    const lineWidth = points.w || size.pen;
    if (points.length === 1) {
      inkDot(points[0], lineWidth);
      return;
    }

    inkStyle(lineWidth);
    tracePath(ink, points);
    ink.stroke();
  };

  const redrawInk = () => {
    ink.clearRect(0, 0, width, height);
    for (const stroke of inkStrokes) {
      renderInkStroke(stroke);
    }
  };

  const opacityForDepth = (alpha: number) => Math.min(1, alpha * fogDepth);

  const blotch = (x: number, y: number, radius: number, alpha: number) => {
    const gradient = fog.createRadialGradient(width * x, height * y, 0, width * x, height * y, Math.max(width, height) * radius);
    gradient.addColorStop(0, `rgba(222,234,250,${alpha})`);
    gradient.addColorStop(1, 'rgba(222,234,250,0)');
    fog.fillStyle = gradient;
    fog.fillRect(0, 0, width, height);
  };

  const paintHaze = () => {
    fog.globalCompositeOperation = 'source-over';
    fog.shadowBlur = 0;
    fog.fillStyle = `rgba(208,224,244,${opacityForDepth(0.1)})`;
    fog.fillRect(0, 0, width, height);

    const gradient = fog.createRadialGradient(width * 0.5, height * 0.46, Math.min(width, height) * 0.22, width * 0.5, height * 0.5, Math.max(width, height) * 0.72);
    gradient.addColorStop(0, 'rgba(214,228,246,0)');
    gradient.addColorStop(1, `rgba(214,228,246,${opacityForDepth(0.12)})`);
    fog.fillStyle = gradient;
    fog.fillRect(0, 0, width, height);

    blotch(0.18, 0.2, 0.5, opacityForDepth(0.06));
    blotch(0.82, 0.74, 0.55, opacityForDepth(0.05));
    blotch(0.6, 0.12, 0.4, opacityForDepth(0.04));
  };

  const renderWipeStroke = (points: GlassStroke) => {
    const lineWidth = points.w || size.finger;
    fog.globalCompositeOperation = 'destination-out';
    fog.lineCap = 'round';
    fog.lineJoin = 'round';
    fog.strokeStyle = 'rgba(0,0,0,0.92)';
    fog.lineWidth = lineWidth;

    if (points.length === 1) {
      fog.fillStyle = 'rgba(0,0,0,0.92)';
      fog.beginPath();
      fog.arc(points[0].x * width, points[0].y * height, lineWidth / 2, 0, Math.PI * 2);
      fog.fill();
    }

    for (let i = 1; i < points.length; i += 1) {
      fog.beginPath();
      fog.moveTo(points[i - 1].x * width, points[i - 1].y * height);
      fog.lineTo(points[i].x * width, points[i].y * height);
      fog.stroke();
    }

    fog.globalCompositeOperation = 'source-over';
  };

  const redrawFog = () => {
    fog.globalCompositeOperation = 'source-over';
    fog.clearRect(0, 0, width, height);
    paintHaze();
    for (const stroke of wipeStrokes) {
      renderWipeStroke(stroke);
    }
    fog.globalCompositeOperation = 'source-over';
  };

  const wipeSegmentLive = (from: GlassPoint, to: GlassPoint, lineWidth = size.finger) => {
    fog.globalCompositeOperation = 'destination-out';
    fog.lineCap = 'round';
    fog.lineJoin = 'round';
    fog.strokeStyle = 'rgba(0,0,0,0.92)';
    fog.lineWidth = lineWidth;
    fog.beginPath();
    fog.moveTo(from.x * width, from.y * height);
    fog.lineTo(to.x * width, to.y * height);
    fog.stroke();
    fog.globalCompositeOperation = 'source-over';
  };

  const syncFrostFog = () => {
    const frost = pane.querySelector<HTMLElement>('.gw-frost');
    const cold = Math.max(0, Math.min(1, (fogDepth - 0.3) / 2));
    const opacity = (0.08 + cold * 0.72).toFixed(3);
    frost?.style.setProperty('opacity', opacity);
  };

  const requestFogRedraw = () => {
    if (fogPaintFrame) {
      window.cancelAnimationFrame(fogPaintFrame);
    }

    fogPaintFrame = window.requestAnimationFrame(() => {
      fogPaintFrame = 0;
      syncFrostFog();
      redrawFog();
    });
  };

  const sizeAll = () => {
    const rect = pane.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) {
      return;
    }

    width = rect.width;
    height = rect.height;
    drawCanvas.width = Math.round(width * dpr);
    drawCanvas.height = Math.round(height * dpr);
    fogCanvas.width = Math.round(width * dpr);
    fogCanvas.height = Math.round(height * dpr);
    ink.setTransform(dpr, 0, 0, dpr, 0, 0);
    fog.setTransform(dpr, 0, 0, dpr, 0, 0);
    redrawInk();
    redrawFog();
  };

  const pointFromEvent = (event: PointerEvent): GlassPoint => {
    const rect = drawCanvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / width,
      y: (event.clientY - rect.top) / height
    };
  };

  const pointerDown = (event: PointerEvent) => {
    if (event.button > 0 || width < 2 || slot.classList.contains('gw-exit')) {
      return;
    }

    try {
      drawCanvas.setPointerCapture(event.pointerId);
    } catch {
      // Browsers may reject capture during synthetic tests.
    }

    const point = pointFromEvent(event);
    const points = [point] as GlassStroke;
    points.w = size[tool];
    current = { tool, points };
    if (tool === 'pen') {
      inkStrokes.push(points);
      redrawInk();
    } else {
      wipeStrokes.push(points);
      renderWipeStroke(points);
    }

    event.preventDefault();
  };

  const pointerMove = (event: PointerEvent) => {
    if (!current) {
      return;
    }

    const point = pointFromEvent(event);
    const points = current.points;
    const lastPoint = points[points.length - 1];
    if (Math.hypot((point.x - lastPoint.x) * width, (point.y - lastPoint.y) * height) < 1.2) {
      return;
    }

    points.push(point);
    if (current.tool === 'pen') {
      redrawInk();
    } else {
      wipeSegmentLive(points[points.length - 2], points[points.length - 1], points.w);
    }
  };

  const pointerUp = () => {
    if (!current) {
      return;
    }

    if (current.tool === 'finger') {
      redrawFog();
    }
    current = null;
  };

  const setTool = (nextTool: GlassTool) => {
    tool = nextTool;
    toolPen?.classList.toggle('active', nextTool === 'pen');
    toolFinger?.classList.toggle('active', nextTool === 'finger');
    toolPen?.setAttribute('aria-pressed', nextTool === 'pen' ? 'true' : 'false');
    toolFinger?.setAttribute('aria-pressed', nextTool === 'finger' ? 'true' : 'false');
    brushTherm?.paint();
  };

  const clearAll = () => {
    inkStrokes.length = 0;
    wipeStrokes.length = 0;
    current = null;
    redrawInk();
    redrawFog();
  };

  const makeTherm = (
    element: HTMLElement | null,
    getValue: () => number,
    setValue: (value: number) => void,
    format: (value: number) => string
  ): ThermHandle | null => {
    if (!element) {
      return null;
    }

    const fill = element.querySelector<HTMLElement>('.gw-therm-fill');
    const tube = element.querySelector<HTMLElement>('.gw-therm-tube');
    const valueLabel = element.querySelector<HTMLElement>('.gw-therm-val');
    let dragging = false;

    const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

    const paint = () => {
      const value = clamp01(getValue());
      if (fill) {
        fill.style.height = `${Math.round(value * 100)}%`;
      }
      if (valueLabel) {
        valueLabel.textContent = format(value);
      }
      element.style.setProperty('--gw-therm-v', value.toFixed(3));
    };

    const pick = (clientY: number) => {
      const rect = (tube || element).getBoundingClientRect();
      if (rect.height < 2) {
        return;
      }
      setValue(clamp01(1 - (clientY - rect.top) / rect.height));
      paint();
    };

    const pointerDown = (event: PointerEvent) => {
      dragging = true;
      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is best-effort for browser automation and old engines.
      }
      pick(event.clientY);
      event.preventDefault();
    };

    const pointerMove = (event: PointerEvent) => {
      if (dragging) {
        pick(event.clientY);
      }
    };

    const pointerUp = () => {
      dragging = false;
    };

    const wheel = (event: WheelEvent) => {
      const direction = event.deltaY > 0 ? -0.05 : 0.05;
      setValue(clamp01(getValue() + direction));
      paint();
      event.preventDefault();
    };

    element.addEventListener('pointerdown', pointerDown);
    element.addEventListener('pointermove', pointerMove);
    element.addEventListener('pointerup', pointerUp);
    element.addEventListener('pointercancel', pointerUp);
    element.addEventListener('wheel', wheel, { passive: false });

    paint();

    return {
      paint,
      cleanup: () => {
        element.removeEventListener('pointerdown', pointerDown);
        element.removeEventListener('pointermove', pointerMove);
        element.removeEventListener('pointerup', pointerUp);
        element.removeEventListener('pointercancel', pointerUp);
        element.removeEventListener('wheel', wheel);
      }
    };
  };

  const setGlassOff = (off: boolean) => {
    slot.classList.toggle('gw-off', off);
    toggleButton?.classList.toggle('off', off);
    toggleButton?.setAttribute('aria-pressed', off ? 'false' : 'true');
  };

  const toggleGlass = () => setGlassOff(!slot.classList.contains('gw-off'));

  const keyDown = (event: KeyboardEvent) => {
    if (event.key === 'p') {
      size.pen = Math.min(penMax, Math.max(penMin, size.pen));
      setTool('pen');
    }
    if (event.key === 'f') {
      size.finger = Math.min(fingerMax, Math.max(fingerMin, size.finger));
      setTool('finger');
    }
  };

  const onPenClick = () => setTool('pen');
  const onFingerClick = () => setTool('finger');
  const glassWindow = window as GlassWindow;
  const previousToggle = glassWindow.gwToggle;
  glassWindow.gwToggle = toggleGlass;
  toolPen?.addEventListener('click', onPenClick);
  toolFinger?.addEventListener('click', onFingerClick);
  clearButton?.addEventListener('click', clearAll);
  toggleButton?.addEventListener('click', toggleGlass);
  cleanupCallbacks.push(() => {
    toolPen?.removeEventListener('click', onPenClick);
    toolFinger?.removeEventListener('click', onFingerClick);
    clearButton?.removeEventListener('click', clearAll);
    toggleButton?.removeEventListener('click', toggleGlass);
    if (previousToggle) {
      glassWindow.gwToggle = previousToggle;
    } else {
      delete glassWindow.gwToggle;
    }
  });

  const fogTherm = makeTherm(
    document.getElementById('gw-therm-fog'),
    () => 1 - (fogDepth - 0.3) / 2,
    (value) => {
      fogDepth = 0.3 + (1 - value) * 2;
      requestFogRedraw();
    },
    (value) => `${Math.round(-13 + value * 20)}C`
  );
  brushTherm = makeTherm(
    document.getElementById('gw-therm-brush'),
    () => {
      if (tool === 'pen') {
        return (size.pen - penMin) / (penMax - penMin);
      }
      return (size.finger - fingerMin) / (fingerMax - fingerMin);
    },
    (value) => {
      if (tool === 'pen') {
        size.pen = penMin + value * (penMax - penMin);
      } else {
        size.finger = fingerMin + value * (fingerMax - fingerMin);
      }
    },
    (value) => `${Math.round(-13 + value * 20)}F`
  );
  if (fogTherm) {
    cleanupCallbacks.push(fogTherm.cleanup);
  }
  if (brushTherm) {
    cleanupCallbacks.push(brushTherm.cleanup);
  }
  setTool('finger');
  setGlassOff(false);
  syncFrostFog();
  sizeAll();
  const observer = new ResizeObserver(sizeAll);
  observer.observe(pane);
  window.addEventListener('resize', sizeAll);
  window.addEventListener('keydown', keyDown);
  drawCanvas.addEventListener('pointerdown', pointerDown);
  drawCanvas.addEventListener('pointermove', pointerMove);
  drawCanvas.addEventListener('pointerup', pointerUp);
  drawCanvas.addEventListener('pointercancel', pointerUp);
  drawCanvas.addEventListener('pointerleave', pointerUp);

  return () => {
    if (fogPaintFrame) {
      window.cancelAnimationFrame(fogPaintFrame);
    }
    observer.disconnect();
    window.removeEventListener('resize', sizeAll);
    window.removeEventListener('keydown', keyDown);
    drawCanvas.removeEventListener('pointerdown', pointerDown);
    drawCanvas.removeEventListener('pointermove', pointerMove);
    drawCanvas.removeEventListener('pointerup', pointerUp);
    drawCanvas.removeEventListener('pointercancel', pointerUp);
    drawCanvas.removeEventListener('pointerleave', pointerUp);
    for (const cleanup of cleanupCallbacks) {
      cleanup();
    }
  };
}

export function startRainRipple(refs: RainRippleRefs, heroImage: string): Cleanup | undefined {
  const root = refs.root.current;
  const slot = refs.slot.current;
  const pane = refs.pane.current;
  const rippleCanvas = refs.ripple.current;
  const rippleBgCanvas = refs.rippleBg.current;
  const drawCanvas = refs.draw.current;

  if (!root || !slot || !pane || !rippleCanvas || !rippleBgCanvas || !drawCanvas) {
    return undefined;
  }

  const ripple = rippleCanvas.getContext('2d');
  const rippleBg = rippleBgCanvas.getContext('2d');
  if (!ripple || !rippleBg) {
    return undefined;
  }

  const dpr = Math.max(1, Math.min(1.35, window.devicePixelRatio || 1));
  const random = (min: number, max: number) => min + Math.random() * (max - min);
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const mobileMedia = window.matchMedia?.('(max-width:900px)') ?? { matches: false };
  const sim = document.createElement('canvas');
  const damping = 0.986;
  const refraction = 2.35;
  const light = 13.5;
  const step = 1 / 30;
  const waterFrameIntervalMs = 1000 / 30;
  let width = 0;
  let height = 0;
  let image: HTMLImageElement | null = null;
  let refractOk = true;
  let simWidth = 0;
  let simHeight = 0;
  let h1 = new Float32Array(0);
  let h2 = new Float32Array(0);
  let bgData: ImageData | null = null;
  let outImage: ImageData | null = null;
  let simCtx: CanvasRenderingContext2D | null = null;
  let mode: 'pane' | 'bg' | null = null;
  let targetOk = false;
  let shownPane = false;
  let shownBg = false;
  let waterClock = 0;
  let rainClock = random(0.6, 1.6);
  let ambientClock = random(1.5, 3);
  let last = 0;
  let lastRenderedAt = 0;
  let stepAccumulator = 0;
  let frame = 0;
  let running = true;
  const drops: Array<{ x: number; y: number; targetY: number; sx: number; sy: number; strength: number; v: number; vx: number; w: number }> = [];
  const plips: Array<{ x: number; y: number; t: number }> = [];
  const stirPoints = new Map<number, { x: number; y: number }>();

  const poke = (cx: number, cy: number, strength: number, radius: number) => {
    const x0 = Math.trunc(cx);
    const y0 = Math.trunc(cy);
    const radiusSq = radius * radius;
    const rounded = Math.ceil(radius);
    for (let y = -rounded; y <= rounded; y += 1) {
      for (let x = -rounded; x <= rounded; x += 1) {
        const px = x0 + x;
        const py = y0 + y;
        if (px < 1 || py < 1 || px >= simWidth - 1 || py >= simHeight - 1) {
          continue;
        }

        const falloff = (x * x + y * y) / radiusSq;
        if (falloff > 1) {
          continue;
        }

        h1[py * simWidth + px] += strength * (0.5 + 0.5 * Math.cos(Math.PI * Math.sqrt(falloff)));
      }
    }
  };

  const stepWater = () => {
    waterClock += 0.0333;
    for (let y = 1; y < simHeight - 1; y += 1) {
      let index = y * simWidth + 1;
      for (let x = 1; x < simWidth - 1; x += 1, index += 1) {
        h2[index] =
          ((h1[index - 1] + h1[index + 1] + h1[index - simWidth] + h1[index + simWidth]) * 0.5 - h2[index]) * damping +
          0.0024 * Math.sin(waterClock * 0.7 + x * 0.05 + y * 0.021) +
          0.0019 * Math.sin(waterClock * 0.43 - x * 0.023 + y * 0.041);
      }
    }

    const temp = h1;
    h1 = h2;
    h2 = temp;
  };

  const renderWater = () => {
    if (!mode || !simCtx || !outImage) {
      return;
    }

    const ctx = mode === 'bg' ? rippleBg : ripple;
    const gloss = mode === 'bg' || !refractOk;
    const dst = outImage.data;
    const src = gloss ? null : bgData?.data ?? null;
    const gain = mode === 'bg' ? 170 : 360;
    const cap = mode === 'bg' ? 112 : 168;

    for (let y = 0; y < simHeight; y += 1) {
      const yu = y > 0 ? y - 1 : y;
      const yd = y < simHeight - 1 ? y + 1 : y;
      for (let x = 0; x < simWidth; x += 1) {
        const i = y * simWidth + x;
        const left = x > 0 ? i - 1 : i;
        const right = x < simWidth - 1 ? i + 1 : i;
        const gx = h1[left] - h1[right];
        const gy = h1[yu * simWidth + x] - h1[yd * simWidth + x];
        const di = i * 4;

        if (src) {
          const sx = Math.max(0, Math.min(simWidth - 1, Math.trunc(x + gx * refraction)));
          const sy = Math.max(0, Math.min(simHeight - 1, Math.trunc(y + gy * refraction)));
          const si = (sy * simWidth + sx) * 4;
          const shade = gy * light;
          const edge = Math.min(1, Math.abs(gx) * 1.25 + Math.abs(gy) * 1.8);
          dst[di] = src[si] + shade + edge * 22;
          dst[di + 1] = src[si + 1] + shade + edge * 30;
          dst[di + 2] = src[si + 2] + shade * 1.28 + edge * 44;
          dst[di + 3] = 222 + Math.round(edge * 26);
        } else {
          let alpha = gy * gain;
          if (alpha >= 0) {
            dst[di] = 224;
            dst[di + 1] = 238;
            dst[di + 2] = 255;
            dst[di + 3] = alpha > cap ? cap : alpha;
          } else {
            alpha = -alpha;
            dst[di] = 10;
            dst[di + 1] = 22;
            dst[di + 2] = 44;
            dst[di + 3] = alpha > cap ? cap : alpha;
          }
        }
      }
    }

    simCtx.putImageData(outImage, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (src) {
      ctx.filter = 'saturate(0.94) brightness(0.98) contrast(1.05)';
      ctx.drawImage(sim, 0, 0, width, height);
      ctx.filter = 'none';
    } else {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(sim, 0, 0, width, height);
    }
  };

  const spawnDrop = (strength: number) => {
    const sx = random(2, simWidth - 2);
    const sy = random(2, simHeight - 2);
    const px = (sx / simWidth) * width;
    const py = (sy / simHeight) * height;
    const fall = height * random(0.34, 0.52);
    const duration = random(0.3, 0.42);
    const vx = random(-8, 14);
    drops.push({
      x: px - vx * duration,
      y: py - fall,
      targetY: py,
      sx,
      sy,
      strength,
      v: fall / duration,
      vx,
      w: 1 + strength * 0.35
    });
  };

  const updateDrops = (dt: number, ctx: CanvasRenderingContext2D) => {
    for (let i = drops.length - 1; i >= 0; i -= 1) {
      const drop = drops[i];
      drop.x += drop.vx * dt;
      drop.y += drop.v * dt;
      if (drop.y >= drop.targetY) {
        poke(drop.sx, drop.sy, drop.strength * 2.15, 2.35);
        poke(drop.sx, drop.sy, -drop.strength * 0.78, 4.8);
        plips.push({ x: drop.x, y: drop.targetY, t: 0.34 });
        drops.splice(i, 1);
        continue;
      }

      const length = Math.min(26, drop.v * 0.045);
      const tailX = drop.x - drop.vx * (length / drop.v);
      const tailY = drop.y - length;
      const gradient = ctx.createLinearGradient(tailX, tailY, drop.x, drop.y);
      gradient.addColorStop(0, 'rgba(214,229,248,0)');
      gradient.addColorStop(0.7, 'rgba(206,223,246,0.42)');
      gradient.addColorStop(1, 'rgba(232,243,255,0.8)');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = drop.w;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(drop.x, drop.y);
      ctx.stroke();
    }

    for (let i = plips.length - 1; i >= 0; i -= 1) {
      const plip = plips[i];
      plip.t -= dt;
      if (plip.t <= 0) {
        plips.splice(i, 1);
        continue;
      }

      const alpha = plip.t / 0.34;
      ctx.strokeStyle = `rgba(232,246,255,${(0.72 * alpha).toFixed(3)})`;
      ctx.lineWidth = mode === 'bg' ? 1.2 : 1.6;
      ctx.beginPath();
      ctx.arc(plip.x, plip.y, 1.8 + (1 - alpha) * 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(240,249,255,${(0.66 * alpha * alpha).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(plip.x, plip.y, 1.9 * alpha + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const rhythm = (dt: number) => {
    rainClock -= dt;
    if (rainClock <= 0) {
      rainClock = random(0.42, 1.15);
      spawnDrop(random(1.25, 2.35));
      if (Math.random() < 0.45) {
        spawnDrop(random(0.75, 1.35));
      }
    }

    ambientClock -= dt;
    if (ambientClock <= 0) {
      ambientClock = random(1.25, 2.8);
      poke(random(2, simWidth - 2), random(2, simHeight - 2), random(0.55, 1.1), 4.2);
    }
  };

  const toSim = (event: PointerEvent) => {
    if (mode === 'pane') {
      const rect = pane.getBoundingClientRect();
      if (rect.width < 2 || event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
        return null;
      }

      return {
        x: ((event.clientX - rect.left) / rect.width) * simWidth,
        y: ((event.clientY - rect.top) / rect.height) * simHeight
      };
    }

    return {
      x: (event.clientX / width) * simWidth,
      y: (event.clientY / height) * simHeight
    };
  };

  const stir = (event: PointerEvent) => {
    if (!(event.buttons & 1) || !targetOk || idleNow()) {
      return;
    }

    const point = toSim(event);
    if (!point) {
      return;
    }

    const lastPoint = stirPoints.get(event.pointerId);
    if (!lastPoint) {
      stirPoints.set(event.pointerId, point);
      return;
    }

    const dx = point.x - lastPoint.x;
    const dy = point.y - lastPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 1.15) {
      return;
    }

    const steps = Math.min(9, Math.ceil(distance / 1.15));
    const strength = Math.min(1.15, 0.22 + distance * 0.075);
    for (let i = 1; i <= steps; i += 1) {
      poke(lastPoint.x + (dx * i) / steps, lastPoint.y + (dy * i) / steps, strength, 2.35);
    }

    stirPoints.set(event.pointerId, point);
  };

  const tap = (event: PointerEvent) => {
    if (!targetOk || idleNow()) {
      return;
    }

    const point = toSim(event);
    if (!point) {
      return;
    }

    stirPoints.set(event.pointerId, point);
    poke(point.x, point.y, 3.8, 4.4);
    poke(point.x, point.y, -1.15, 8.2);
  };

  const lift = (event: PointerEvent) => {
    stirPoints.delete(event.pointerId);
  };

  const gridFit = () => {
    simWidth = Math.min(520, Math.max(260, Math.round(width / 2.7)));
    simHeight = Math.min(360, Math.max(150, Math.round((simWidth * height) / width)));
    sim.width = simWidth;
    sim.height = simHeight;
    simCtx = sim.getContext('2d');
    h1 = new Float32Array(simWidth * simHeight);
    h2 = new Float32Array(simWidth * simHeight);
    stepAccumulator = 0;
    stirPoints.clear();
    drops.length = 0;
    plips.length = 0;
  };

  const rebuildBackground = () => {
    if (!simCtx) {
      return false;
    }

    if (!image || !image.naturalWidth || !image.naturalHeight) {
      bgData = null;
      refractOk = false;
      slot.classList.add('gw-gloss');
      outImage = simCtx.createImageData(simWidth, simHeight);
      return true;
    }

    const imageWidth = image.naturalWidth;
    const imageHeight = image.naturalHeight;

    const scale = Math.max(width / imageWidth, height / imageHeight);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (imageWidth - sourceWidth) / 2;
    const sourceY = (imageHeight - sourceHeight) / 2;
    const tmp = document.createElement('canvas');
    tmp.width = simWidth;
    tmp.height = simHeight;
    const tmpCtx = tmp.getContext('2d');
    if (!tmpCtx) {
      return false;
    }

    tmpCtx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, simWidth, simHeight);
    try {
      bgData = tmpCtx.getImageData(0, 0, simWidth, simHeight);
      refractOk = true;
      slot.classList.remove('gw-gloss');
    } catch {
      bgData = null;
      refractOk = false;
      slot.classList.add('gw-gloss');
    }

    outImage = simCtx.createImageData(simWidth, simHeight);
    return true;
  };

  const retarget = (nextMode: 'pane' | 'bg') => {
    if (nextMode === 'pane') {
      const rect = pane.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) {
        return false;
      }

      width = rect.width;
      height = rect.height;
      rippleCanvas.width = Math.round(width * dpr);
      rippleCanvas.height = Math.round(height * dpr);
      gridFit();
      return rebuildBackground();
    }

    width = window.innerWidth;
    height = window.innerHeight;
    if (width < 2 || height < 2) {
      return false;
    }

    rippleBgCanvas.width = Math.round(width * dpr);
    rippleBgCanvas.height = Math.round(height * dpr);
    gridFit();
    if (!simCtx) {
      return false;
    }

    outImage = simCtx.createImageData(simWidth, simHeight);
    for (let i = 0; i < 3; i += 1) {
      poke(random(2, simWidth - 2), random(2, simHeight - 2), random(0.5, 1.1), 2);
    }
    return true;
  };

  const computeMode = (): 'pane' | 'bg' => (!slot!.classList.contains('gw-off') && !mobileMedia.matches ? 'pane' : 'bg');

  function idleNow() {
    if (document.hidden) {
      return true;
    }

    if (slot!.classList.contains('gw-exit')) {
      return true;
    }

    return root!.classList.contains('is-leaving') || root!.classList.contains('is-dissolving');
  }

  const loop = (time: number) => {
    if (!running) {
      return;
    }

    frame = window.requestAnimationFrame(loop);
    const nextMode = computeMode();
    if (nextMode !== mode) {
      mode = nextMode;
      targetOk = retarget(nextMode);
      if (nextMode !== 'bg') {
        rippleBgCanvas.classList.remove('on');
        shownBg = false;
      }
    }

    if (!targetOk || idleNow()) {
      last = time;
      return;
    }

    if (time - lastRenderedAt < waterFrameIntervalMs) {
      return;
    }
    lastRenderedAt = time;

    const raw = (time - last) / 1000 || 0.016;
    last = time;
    const dt = Math.min(0.05, raw);
    rhythm(Math.min(2, raw));
    stepAccumulator += dt;

    let ticks = 0;
    while (stepAccumulator >= step && ticks < 2) {
      stepWater();
      stepAccumulator -= step;
      ticks += 1;
    }

    renderWater();
    updateDrops(dt, mode === 'bg' ? rippleBg : ripple);
    if (mode === 'pane') {
      if (!shownPane) {
        shownPane = true;
        slot.classList.add('gw-rippling');
      }
    } else if (!shownBg) {
      shownBg = true;
      rippleBgCanvas.classList.add('on');
    }
  };

  const onDrawPointerDown = (event: PointerEvent) => {
    if (mode === 'pane') {
      tap(event);
    }
  };
  const onDrawPointerMove = (event: PointerEvent) => {
    if (mode === 'pane') {
      stir(event);
    }
  };
  const onRootPointerDown = (event: PointerEvent) => {
    if (mode === 'bg') {
      tap(event);
    }
  };
  const onRootPointerMove = (event: PointerEvent) => {
    if (mode === 'bg') {
      stir(event);
    }
  };
  const onResize = () => {
    if (mode) {
      targetOk = retarget(mode);
    }
  };

  const observer = new ResizeObserver(() => {
    if (mode === 'pane') {
      targetOk = retarget('pane');
    }
  });
  observer.observe(pane);
  window.addEventListener('resize', onResize);
  drawCanvas.addEventListener('pointerdown', onDrawPointerDown);
  drawCanvas.addEventListener('pointermove', onDrawPointerMove);
  drawCanvas.addEventListener('pointerup', lift);
  drawCanvas.addEventListener('pointercancel', lift);
  drawCanvas.addEventListener('pointerleave', lift);
  root.addEventListener('pointerdown', onRootPointerDown, { passive: true });
  root.addEventListener('pointermove', onRootPointerMove, { passive: true });
  root.addEventListener('pointerup', lift, { passive: true });
  root.addEventListener('pointercancel', lift, { passive: true });
  root.addEventListener('pointerleave', lift, { passive: true });

  const probe = new Image();
  probe.onload = () => {
    image = probe;
    if (probe.naturalWidth > 0 && probe.naturalHeight > 0) {
      root.style.setProperty('--gw-ar', (probe.naturalWidth / probe.naturalHeight).toFixed(6));
    }
    slot.classList.add('gw-has-img');

    if (reducedMotion) {
      mode = 'pane';
      if (retarget('pane')) {
        renderWater();
        slot.classList.add('gw-rippling');
      }
      return;
    }

    if (mode === 'pane') {
      targetOk = retarget('pane');
    }
  };
  probe.onerror = () => {
    image = null;
    slot.classList.add('gw-gloss');

    if (reducedMotion) {
      mode = 'pane';
    }
    if (mode) {
      targetOk = retarget(mode);
      if (reducedMotion && targetOk) {
        renderWater();
        slot.classList.add('gw-rippling');
      }
    }
  };
  probe.src = heroImage;

  if (!reducedMotion) {
    frame = window.requestAnimationFrame(loop);
  }

  return () => {
    running = false;
    window.cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener('resize', onResize);
    drawCanvas.removeEventListener('pointerdown', onDrawPointerDown);
    drawCanvas.removeEventListener('pointermove', onDrawPointerMove);
    drawCanvas.removeEventListener('pointerup', lift);
    drawCanvas.removeEventListener('pointercancel', lift);
    drawCanvas.removeEventListener('pointerleave', lift);
    root.removeEventListener('pointerdown', onRootPointerDown);
    root.removeEventListener('pointermove', onRootPointerMove);
    root.removeEventListener('pointerup', lift);
    root.removeEventListener('pointercancel', lift);
    root.removeEventListener('pointerleave', lift);
  };
}
