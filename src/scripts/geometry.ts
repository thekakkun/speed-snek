export interface Point {
  x: number;
  y: number;
}
export interface Arc {
  center: Point;
  radius: number;
}
export type Path = Point[];

export function dist(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

// Return intersection point if lines intersect, false if no intersection.
export function intersection(seg1: Path, arc: Arc): Point | false;
export function intersection(seg1: Path, seg2: Path): Point | false;
export function intersection(seg1: Path, seg2: Arc | Path): Point | false {
  if ("center" in seg2) {
    const [{ x: x1, y: y1 }, { x: x2, y: y2 }] = seg1;
    const {
      center: { x: xc, y: yc },
      radius,
    } = seg2;

    const a = (x1 - x2) ** 2 + (y1 - y2) ** 2;
    const b = (x1 - x2) * (x2 - xc) + (y1 - y2) * (y2 - yc);
    const c = (x2 - xc) ** 2 + (y2 - yc) ** 2 - radius ** 2;

    const discriminant = b ** 2 - a * c;
    if (discriminant < 0) {
      return false;
    }

    let t: number;
    t = (-b - Math.sqrt(discriminant)) / a;

    if (!(0 <= t && t <= 1)) {
      // getting the other intersection
      t = (-b + Math.sqrt(discriminant)) / a;
    }
    if (!(0 <= t && t <= 1)) {
      // t still out of range? then no intersection.
      return false;
    }

    return {
      x: t * x1 + (1 - t) * x2,
      y: t * y1 + (1 - t) * y2,
    };
  } else {
    const [{ x: x1, y: y1 }, { x: x2, y: y2 }] = seg1;
    const [{ x: x3, y: y3 }, { x: x4, y: y4 }] = seg2;

    const t =
      ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) /
      ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
    if (!(0 <= t && t <= 1)) {
      return false;
    }

    const u =
      ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) /
      ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
    if (!(0 <= u && u <= 1)) {
      return false;
    }

    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    };
  }
}
