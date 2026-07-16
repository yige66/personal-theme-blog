export type RoomPoint = {
  x: number;
  y: number;
};

export type RoomObstacle = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type RoomPathNode = RoomPoint & {
  id: string;
};

const GRID_STEP = 7;

export function parseWalkPolygon(points: string): RoomPoint[] {
  return points
    .split(/\s+/)
    .map((pair) => pair.split(',').map(Number))
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
    .map(([x, y]) => ({ x, y }));
}

export function toSvgPoints(points: RoomPoint[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

export function pointInPolygon(point: RoomPoint, polygon: RoomPoint[]): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const current = polygon[i];
    const previous = polygon[j];
    const intersects = ((current.y > point.y) !== (previous.y > point.y))
      && (point.x < ((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y || 1) + current.x);

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

export function pointInObstacle(point: RoomPoint, obstacle: RoomObstacle): boolean {
  return point.x >= obstacle.x
    && point.x <= obstacle.x + obstacle.w
    && point.y >= obstacle.y
    && point.y <= obstacle.y + obstacle.h;
}

export function isWalkable(point: RoomPoint, polygon: RoomPoint[], obstacles: RoomObstacle[]): boolean {
  return pointInPolygon(point, polygon) && !obstacles.some((obstacle) => pointInObstacle(point, obstacle));
}

export function clampToWalkable(point: RoomPoint, polygon: RoomPoint[], obstacles: RoomObstacle[]): RoomPoint {
  if (isWalkable(point, polygon, obstacles)) {
    return point;
  }

  const candidates: RoomPoint[] = [];
  const bounds = getBounds(polygon);

  for (let radius = GRID_STEP; radius <= 42; radius += GRID_STEP) {
    for (let angle = 0; angle < 360; angle += 22.5) {
      const radian = (angle / 180) * Math.PI;
      const candidate = {
        x: clamp(point.x + Math.cos(radian) * radius, bounds.minX, bounds.maxX),
        y: clamp(point.y + Math.sin(radian) * radius, bounds.minY, bounds.maxY)
      };

      if (isWalkable(candidate, polygon, obstacles)) {
        candidates.push(candidate);
      }
    }

    if (candidates.length > 0) {
      return candidates.sort((a, b) => distance(a, point) - distance(b, point))[0];
    }
  }

  return polygon[Math.floor(polygon.length / 2)] ?? { x: 50, y: 70 };
}

export function createRoomPath(start: RoomPoint, end: RoomPoint, polygon: RoomPoint[], obstacles: RoomObstacle[]): RoomPathNode[] {
  const safeStart = clampToWalkable(start, polygon, obstacles);
  const safeEnd = clampToWalkable(end, polygon, obstacles);

  if (hasLineOfSight(safeStart, safeEnd, polygon, obstacles)) {
    return toPathNodes([safeStart, safeEnd]);
  }

  const grid = buildGrid(polygon, obstacles);
  const startNode = nearestGridPoint(safeStart, grid);
  const endNode = nearestGridPoint(safeEnd, grid);
  const gridPath = findPath(startNode, endNode, grid, polygon, obstacles);
  const smoothed = smoothPath([safeStart, ...gridPath, safeEnd], polygon, obstacles);
  return toPathNodes(smoothed);
}

export function buildPathPolyline(path: RoomPathNode[]): string {
  return path.map((point) => `${round(point.x)},${round(point.y)}`).join(' ');
}

export function createObstacleOverlay(obstacles: RoomObstacle[]): Array<RoomObstacle & { style: { left: string; top: string; width: string; height: string } }> {
  return obstacles.map((obstacle) => ({
    ...obstacle,
    style: {
      left: `${obstacle.x}%`,
      top: `${obstacle.y}%`,
      width: `${obstacle.w}%`,
      height: `${obstacle.h}%`
    }
  }));
}

function buildGrid(polygon: RoomPoint[], obstacles: RoomObstacle[]): RoomPoint[] {
  const bounds = getBounds(polygon);
  const points: RoomPoint[] = [];

  for (let y = bounds.minY; y <= bounds.maxY; y += GRID_STEP) {
    for (let x = bounds.minX; x <= bounds.maxX; x += GRID_STEP) {
      const point = { x, y };
      if (isWalkable(point, polygon, obstacles)) {
        points.push(point);
      }
    }
  }

  return points;
}

function findPath(start: RoomPoint, end: RoomPoint, grid: RoomPoint[], polygon: RoomPoint[], obstacles: RoomObstacle[]): RoomPoint[] {
  const open = new Set([pointKey(start)]);
  const cameFrom = new Map<string, string>();
  const nodeMap = new Map(grid.map((point) => [pointKey(point), point]));
  nodeMap.set(pointKey(start), start);
  nodeMap.set(pointKey(end), end);

  const gScore = new Map<string, number>([[pointKey(start), 0]]);
  const fScore = new Map<string, number>([[pointKey(start), distance(start, end)]]);

  while (open.size > 0) {
    const currentKey = [...open].sort((a, b) => (fScore.get(a) ?? Infinity) - (fScore.get(b) ?? Infinity))[0];
    const current = nodeMap.get(currentKey);

    if (!current) {
      break;
    }

    if (distance(current, end) <= GRID_STEP) {
      return reconstructPath(cameFrom, currentKey, nodeMap);
    }

    open.delete(currentKey);

    for (const neighbor of getNeighbors(current, grid, polygon, obstacles)) {
      const neighborKey = pointKey(neighbor);
      nodeMap.set(neighborKey, neighbor);
      const tentative = (gScore.get(currentKey) ?? Infinity) + distance(current, neighbor);

      if (tentative < (gScore.get(neighborKey) ?? Infinity)) {
        cameFrom.set(neighborKey, currentKey);
        gScore.set(neighborKey, tentative);
        fScore.set(neighborKey, tentative + distance(neighbor, end));
        open.add(neighborKey);
      }
    }
  }

  return [start, end];
}

function smoothPath(points: RoomPoint[], polygon: RoomPoint[], obstacles: RoomObstacle[]): RoomPoint[] {
  if (points.length <= 2) {
    return points;
  }

  const result: RoomPoint[] = [points[0]];
  let anchor = 0;

  while (anchor < points.length - 1) {
    let next = points.length - 1;
    while (next > anchor + 1 && !hasLineOfSight(points[anchor], points[next], polygon, obstacles)) {
      next -= 1;
    }
    result.push(points[next]);
    anchor = next;
  }

  return result;
}

function hasLineOfSight(a: RoomPoint, b: RoomPoint, polygon: RoomPoint[], obstacles: RoomObstacle[]): boolean {
  const steps = Math.max(2, Math.ceil(distance(a, b) / 2));

  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const point = {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t
    };

    if (!isWalkable(point, polygon, obstacles)) {
      return false;
    }
  }

  return true;
}

function getNeighbors(point: RoomPoint, grid: RoomPoint[], polygon: RoomPoint[], obstacles: RoomObstacle[]): RoomPoint[] {
  const deltas = [
    [-GRID_STEP, 0],
    [GRID_STEP, 0],
    [0, -GRID_STEP],
    [0, GRID_STEP],
    [-GRID_STEP, -GRID_STEP],
    [GRID_STEP, -GRID_STEP],
    [-GRID_STEP, GRID_STEP],
    [GRID_STEP, GRID_STEP]
  ];
  const keys = new Set(grid.map(pointKey));

  return deltas
    .map(([x, y]) => ({ x: point.x + x, y: point.y + y }))
    .filter((candidate) => keys.has(pointKey(candidate)) && hasLineOfSight(point, candidate, polygon, obstacles));
}

function nearestGridPoint(point: RoomPoint, grid: RoomPoint[]): RoomPoint {
  return [...grid].sort((a, b) => distance(a, point) - distance(b, point))[0] ?? point;
}

function reconstructPath(cameFrom: Map<string, string>, currentKey: string, nodeMap: Map<string, RoomPoint>): RoomPoint[] {
  const path = [nodeMap.get(currentKey)].filter(Boolean) as RoomPoint[];
  let cursor = currentKey;

  while (cameFrom.has(cursor)) {
    cursor = cameFrom.get(cursor) as string;
    const point = nodeMap.get(cursor);
    if (point) {
      path.unshift(point);
    }
  }

  return path;
}

function toPathNodes(points: RoomPoint[]): RoomPathNode[] {
  return points.map((point, index) => ({
    id: `path-${index}-${round(point.x)}-${round(point.y)}`,
    x: round(point.x),
    y: round(point.y)
  }));
}

function getBounds(points: RoomPoint[]) {
  return {
    minX: Math.min(...points.map((point) => point.x)),
    maxX: Math.max(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxY: Math.max(...points.map((point) => point.y))
  };
}

function pointKey(point: RoomPoint): string {
  return `${roundToGrid(point.x)}:${roundToGrid(point.y)}`;
}

function roundToGrid(value: number): number {
  return Math.round(value / GRID_STEP) * GRID_STEP;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function distance(a: RoomPoint, b: RoomPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
