/** A single point defined by an x and y coordinate. */
export interface Point {
  x: number;
  y: number;
}
/** An arc, defined by a center point and radius. */
export interface Arc {
  center: Point;
  radius: number;
}
/** A list of Points. */
export type Path = Point[];

/**
 * Calculate the distance between two points.
 * @param p1 The first point.
 * @param p2 The second point.
 * @returns The distance between the two points.
 */
export function dist(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

/**
 *
 * @param seg1 A line segment, defined by two points.
 * @param arc An arc, defined by a center and radius.
 */
export function intersection(seg1: Path, arc: Arc): Point | null;
/**
 *
 * @param seg1 A line segment, defined by two points.
 * @param seg2 A line segment, defined by two points.
 */
export function intersection(seg1: Path, seg2: Path): Point | null;
/**
 *
 * @param seg1 A line segment.
 * @param seg2 A line segment or arc.
 * @returns the intersection coordinates between seg1 and seg2
 * or null if no intersection.
 */
export function intersection(seg1: Path, seg2: Arc | Path): Point | null {
  if ("center" in seg2) {
    const [{ x: x1, y: y1 }, { x: x2, y: y2 }] = seg1;
    const {
      center: { x: xc, y: yc },
      radius,
    } = seg2;

    const a = (x1 - x2) ** 2 + (y1 - y2) ** 2;
    const b = (x1 - x2) * (x2 - xc) + (y1 - y2) * (y2 - yc);
    const c = (x2 - xc) ** 2 + (y2 - yc) ** 2 - radius ** 2;

    /**
     * discriminant > 0: 2 intersections
     *
     * discriminant = 0: 1 intersection
     *
     * discriminant < 0: 0 intersections
     */
    const discriminant = b ** 2 - a * c;
    if (discriminant < 0) {
      return null;
    }

    /**
     * Parameter representing the line.
     * Falls between the two points if 0 <= t <= 1.
     */
    let t: number;
    t = (-b - Math.sqrt(discriminant)) / a;

    // recalculate if current t places intersection outside of line segment.
    if (!inRange(t)) {
      t = (-b + Math.sqrt(discriminant)) / a;

      if (!inRange(t)) {
        // none of the possible values for t resulted in an intersection.
        return null;
      }
    }

    return {
      x: t * x1 + (1 - t) * x2,
      y: t * y1 + (1 - t) * y2,
    };
  } else {
    const [{ x: x1, y: y1 }, { x: x2, y: y2 }] = seg1;
    const [{ x: x3, y: y3 }, { x: x4, y: y4 }] = seg2;

    /** If this is zero, line segments are parallel. */
    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denominator) < Number.EPSILON) {
      return null;
    }

    /**
     * Parameter representing the line through seg1.
     * Falls between the two points of seg1 if  0 <= t <= 1.
     */
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
    if (!inRange(t, true)) {
      return null;
    }

    /**
     * Parameter representing the line through seg2.
     * Falls between the two points of seg2 if  0 <= u <= 1.
     */
    const u = ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) / denominator;
    if (!inRange(u, true)) {
      return null;
    }

    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    };
  }
}

/**
 * Checks if parameter is within range,
 * with considerations for floating point error.
 * @param t parameter to test for.
 * @param coyote if true, exclude range boundary within floating point error.
 * @param range minimum and maximum acceptable value for t.
 * @returns whether t is between min and max.
 */
function inRange(t: number, coyote = false, range?: [number, number]): boolean {
  const [min, max] = range ?? [0, 1];
  const tolerance = 1;
  /** t is equal to range boundary within floating point error */
  const boundary =
    Math.abs(t - min) < tolerance * Number.EPSILON ||
    Math.abs(t - max) < tolerance * Number.EPSILON;

  if (boundary) {
    return !coyote;
  }
  /** t is between min and max */
  const within = min < t && t < max;
  return within;
}
