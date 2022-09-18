interface Point {
  x: number;
  y: number;
}
interface Arc {
  center: Point;
  radius: number;
}
type Path = Point[];

type Notification = ["pointermove", Cursor] | ["trimpath", Snek];

interface Mediator {
  notify(...args: Notification): void;
}

export class GameModel implements Mediator {
  private cursor: Cursor;
  private snek: Snek;
  // private pellet: Pellet;

  public score: number;

  constructor(
    cursor: Cursor,
    snek: Snek
    // pellet: Pellet
  ) {
    this.cursor = cursor;
    this.cursor.setMediator(this);
    this.snek = snek;
    this.snek.setMediator(this);
    // this.pellet = pellet;
    // this.pellet.setMediator(this);
  }

  public notify(...args: Notification): void {
    const [event, sender] = args;

    switch (event) {
      case "pointermove":
        this.snek.update(sender);
        break;
      case "trimpath":
        this.cursor.trim(sender);
        break;
      default:
        const _exhaustiveCheck: never = sender;
        return _exhaustiveCheck;
    }
  }
}

class BaseComponent {
  protected mediator: Mediator;

  constructor(mediator?: Mediator) {
    this.mediator = mediator!;
  }

  public setMediator(mediator: Mediator): void {
    this.mediator = mediator;
  }
}

export class Cursor extends BaseComponent {
  canvas: HTMLCanvasElement;
  path: Path;

  constructor(canvas: HTMLCanvasElement, path = []) {
    super();
    this.canvas = canvas;
    this.path = path;
  }

  public moveListener(e: PointerEvent) {
    const point = {
      x: e.x - this.canvas.offsetLeft,
      y: e.y - this.canvas.offsetTop,
    };
    this.path.unshift(point);
    this.mediator.notify("pointermove", this);
  }

  public trim(snek: Snek) {
    this.path.splice(snek.pathTail);
  }
}

export class Snek extends BaseComponent {
  segments: number;
  segLength: number;
  snekPath: Path;
  snekWidth: number;
  pathTail: number;

  constructor(
    startLoc: Point,
    segments = 4,
    segLength = 50,
    snekWidth = 10,
    pathBuffer = 0
  ) {
    super();

    this.snekPath = [startLoc];
    for (let i = 0; i < segments; i++) {
      const nextSeg = {
        x: this.snekPath[i].x,
        y: this.snekPath[i].y + segLength,
      };

      this.snekPath.push(nextSeg);
    }

    this.segments = segments;
    this.segLength = segLength;
    this.snekWidth = snekWidth;
    this.pathTail = pathBuffer;
  }

  public update(cursor: Cursor) {
    const cursorPath = cursor.path;
    this.snekPath = [cursorPath[0]];
    let segHead = this.snekPath[this.snekPath.length - 1];
    for (let [ix, p] of cursorPath.entries()) {
      if (this.snekPath.length <= this.segments) {
        while (this.segLength < dist(segHead, p)) {
          const seg = [cursorPath[ix - 1], p];
          const arc = {
            center: segHead,
            radius: this.segLength,
          };
          segHead = intersection(seg, arc) as Point;
          this.snekPath.push(segHead);
          if (this.segments < this.snekPath.length) {
            break;
          }
        }
      } else {
        if (this.segLength * 2 <= dist(segHead, p)) {
          this.pathTail = ix;
          this.mediator.notify("trimpath", this);
          break;
        }
      }
    }
  }
}

class Pellet {
  // r: number;
  // buffer: number;
  // noGo?: Path;
  // loc: Point;
  // constructor(r = 8, buffer = 30, noGo?: Path) {
  //   this.r = r;
  //   this.buffer = buffer;
  //   this.noGo = noGo;
  //   this.loc = this.place();
  // }
  // draw() {
  //   gameCtx.fillStyle = "blue";
  //   gameCtx.beginPath();
  //   gameCtx.arc(this.loc.x, this.loc.y, this.r, 0, Math.PI * 2);
  //   gameCtx.fill();
  // }
  // place() {
  //   let loc: Point;
  //   let locValid: boolean;
  //   while (true) {
  //     locValid = true;
  //     loc = {
  //       x: Math.random() * (gameCanvas.width - this.buffer * 2) + this.buffer,
  //       y: Math.random() * (gameCanvas.height - this.buffer * 2) + this.buffer,
  //     };
  //     if (this.noGo === undefined) {
  //       return loc;
  //     }
  //     // Check if pellet location within buffer distance of noGo path.
  //     for (let i = 0; i < this.noGo.length - 1; i++) {
  //       if (
  //         intersection([this.noGo[i], this.noGo[i + 1]], {
  //           center: loc,
  //           radius: this.r + this.buffer,
  //         })
  //       ) {
  //         locValid = false;
  //         break;
  //       }
  //     }
  //     if (locValid) {
  //       return loc;
  //     }
  //   }
  // }
}

// path: Path;

// constructor(path: Path = [{ x: 0, y: 0 }]) {
//   this.path = path;
// }

// draw() {
//   gameCtx.strokeStyle = "red";
//   gameCtx.lineWidth = 1;
//   gameCtx.beginPath();
//   gameCtx.moveTo(this.path[0].x, this.path[0].y);
//   this.path.forEach((point: Point) => {
//     gameCtx.lineTo(point.x, point.y);
//   });
//   gameCtx.stroke();
// }

// getSpeed(window = 3) {
//   // TODO: How is this influenced by screen resolution & scaling?
//   window = Math.min(window, this.path.length - 1);
//   let travelled = 0;
//   for (let i = 0; i < window; i++) {
//     travelled += dist(this.path[i], this.path[i + 1]);
//   }

//   return travelled / window;
// }

// class Snek extends Cursor {

// update() {
//   this.snekPath = [this.path[0]];
//   let segHead = this.snekPath[this.snekPath.length - 1];
//   for (let [ix, p] of this.path.entries()) {
//     if (this.snekPath.length <= this.segments) {
//       while (this.segLength < dist(segHead, p)) {
//         const seg = [this.path[ix - 1], p];
//         const arc = {
//           center: segHead,
//           radius: this.segLength,
//         };
//         segHead = intersection(seg, arc) as Point;
//         this.snekPath.push(segHead);
//         if (this.segments < this.snekPath.length) {
//           break;
//         }
//       }
//     } else {
//       if (this.segLength * 2 <= dist(segHead, p)) {
//         this.path.splice(ix);
//         break;
//       }
//     }
//   }
// }
// draw() {
//   super.draw();
//   gameCtx.strokeStyle = "green";
//   gameCtx.lineCap = "round";
//   gameCtx.lineJoin = "round";
//   gameCtx.lineWidth = this.snekWidth;
//   gameCtx.beginPath();
//   gameCtx.moveTo(this.snekPath[0].x, this.snekPath[0].y);
//   this.snekPath.forEach((point: Point) => {
//     gameCtx.lineTo(point.x, point.y);
//   });
//   gameCtx.stroke();
// }
// }

function dist(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

// Return intersection point if lines intersect, false if no intersection.
function intersection(seg1: Path, arc: Arc): Point | false;
function intersection(seg1: Path, seg2: Path): Point | false;
function intersection(seg1: Path, seg2: Arc | Path): Point | false {
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
