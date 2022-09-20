import { GraphicsComponent } from "./graphics";

interface Point {
  x: number;
  y: number;
}
interface Arc {
  center: Point;
  radius: number;
}
type Path = Point[];

type Notification =
  | ["pointermove", Cursor]
  | ["trimpath", Snek, number]
  | ["eatpellet", SpeedSnek]
  | ["hitself", SpeedSnek]
  | ["hitwall", SpeedSnek];

interface Mediator {
  notify(notification: Notification): void;
}

export class SpeedSnek implements Mediator {
  private cursor: Cursor;
  private snek: Snek;
  private pellet: Pellet;
  public score: number;

  constructor(cursor: Cursor, snek: Snek, pellet: Pellet) {
    this.cursor = cursor;
    this.cursor.setMediator(this);
    this.snek = snek;
    this.snek.setMediator(this);
    this.pellet = pellet;
    this.pellet.setMediator(this);
    this.score = 0;
  }

  public notify(notification: Notification): void {
    const [event, sender] = notification;

    switch (event) {
      case "pointermove":
        this.snek.update(sender);
        this.checkCollision(sender);
        break;
      case "trimpath":
        const [, , ix] = notification;
        this.cursor.trim(ix);
        break;
      case "eatpellet":
        console.log("nom!");
        this.score += 1;
        this.snek.segments += 1;
        this.pellet.placePellet(undefined, this.snek.snekPath);
        break;
      case "hitself":
        console.log("ouch!");
        break;
      case "hitwall":
        console.log("whoops!");
        break;
      default:
        const _exhaustiveCheck: never = sender;
        return _exhaustiveCheck;
    }
  }

  checkCollision(cursor: Cursor) {
    const snekHead = this.snek.snekPath[0];

    // snek vs pellet collisions
    if (
      dist(snekHead, this.pellet.loc) <=
      this.pellet.r + this.snek.snekWidth / 2
    ) {
      this.notify(["eatpellet", this]);
    }

    // // snek vs wall collisions
    if (
      snekHead.x - 1 <= 0 ||
      cursor.target.width - 1 <= snekHead.x ||
      snekHead.y - 1 <= 0 ||
      cursor.target.height - 1 <= snekHead.y
    ) {
      console.log("whoops!");
    }

    // snek vs snek collisions
    for (let i = 2; i < this.snek.snekPath.length - 1; i++) {
      if (
        intersection(
          [this.snek.snekPath[0], this.snek.snekPath[1]],
          [this.snek.snekPath[i], this.snek.snekPath[i + 1]]
        )
      ) {
        this.notify(["hitself", this]);
        console.log("ouch!");
      }
    }
  }
}

class GameObject extends GraphicsComponent {
  protected mediator: Mediator;

  constructor(mediator?: Mediator) {
    super();
    this.mediator = mediator!;
  }

  public setMediator(mediator: Mediator): void {
    this.mediator = mediator;
  }

  public draw() {}
}

export class Cursor extends GameObject {
  path: Path;

  constructor() {
    super();
    this.path = [];
  }

  public draw() {
    if (this.target === undefined) {
      throw "Draw target is undefined";
    }

    const context = this.target.getContext("2d") as CanvasRenderingContext2D;
    if (this.path.length !== 0) {
      context.strokeStyle = "red";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(this.path[0].x, this.path[0].y);
      this.path.forEach((point: Point) => {
        context.lineTo(point.x, point.y);
      });
      context.stroke();
    }
  }

  public add(point: Point) {
    this.path.unshift(point);
    this.mediator.notify(["pointermove", this]);
  }

  public trim(ix: number) {
    this.path.splice(ix);
  }
}

export class Snek extends GameObject {
  segments: number;
  segLength: number;
  snekPath: Path;
  snekWidth: number;

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
  }

  public draw() {
    if (this.target === undefined) {
      throw "Draw target is undefined";
    }

    const context = this.target.getContext("2d") as CanvasRenderingContext2D;
    context.strokeStyle = "green";
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = this.snekWidth;
    context.beginPath();
    context.moveTo(this.snekPath[0].x, this.snekPath[0].y);
    this.snekPath.forEach((point: Point) => {
      context.lineTo(point.x, point.y);
    });
    context.stroke();
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
          this.mediator.notify(["trimpath", this, ix]);
          break;
        }
      }
    }
  }
}

export class Pellet extends GameObject {
  bb: [Point, Point];
  noGo: Path;
  loc: Point;
  r: number;
  buffer: number;

  constructor(bb: [Point, Point], noGo: Path, r = 8, buffer = 30) {
    super();
    this.bb = bb;
    this.noGo = noGo;
    this.r = r;
    this.buffer = buffer;
    this.placePellet();
  }

  draw() {
    if (this.target === undefined) {
      throw "Draw target is undefined";
    }

    const context = this.target.getContext("2d") as CanvasRenderingContext2D;
    context.fillStyle = "blue";
    context.beginPath();
    context.arc(this.loc.x, this.loc.y, this.r, 0, Math.PI * 2);
    context.fill();
  }

  placePellet(bb?: [Point, Point], noGo?: Path) {
    if (bb !== undefined) {
      this.bb = bb;
    }
    if (noGo !== undefined) {
      this.noGo = noGo;
    }

    let loc: Point;
    let locValid: boolean;

    while (true) {
      locValid = true;
      loc = {
        x: randomBetween(
          this.bb[0].x + this.buffer,
          this.bb[1].x - this.buffer
        ),
        y: randomBetween(
          this.bb[0].y + this.buffer,
          this.bb[1].y - this.buffer
        ),
      };

      // Place is fine if there is no noGo
      if (this.noGo.length === 0) {
        this.loc = loc;
        break;
      }

      // Check if pellet location within buffer distance of noGo path.
      for (let i = 0; i < this.noGo.length - 1; i++) {
        if (
          intersection([this.noGo[i], this.noGo[i + 1]], {
            center: loc,
            radius: this.r + this.buffer,
          })
        ) {
          // loc is too close to noGo, try again.
          locValid = false;
          break;
        }
      }

      if (locValid) {
        this.loc = loc;
        break;
      }
    }
  }

  // newPellet(noGo: Path, bb?: [Point, Point]) {
  //   if (bb !== undefined) {
  //     this.bb = bb;
  //   }
  //   this.noGo = noGo;
  //   this.place();
  // }

  // place() {
  //   let loc: Point;
  //   let locValid: boolean;

  //   while (true) {
  //     locValid = true;
  //     loc = {
  //       x: randomBetween(
  //         this.bb[0].x + this.buffer,
  //         this.bb[1].x - this.buffer
  //       ),
  //       y: randomBetween(
  //         this.bb[0].y + this.buffer,
  //         this.bb[1].y - this.buffer
  //       ),
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

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
