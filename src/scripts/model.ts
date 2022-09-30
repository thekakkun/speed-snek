import { dist, intersection, Path, Point } from "./geometry";
import { Canvas } from "./graphics";

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export class Cursor {
  canvas: Canvas;
  path: Path;
  timeStamp: number[];
  rawSpeed: number;
  lastEvent: string;

  constructor(canvas: Canvas) {
    this.canvas = canvas;
    this.path = [];
    this.timeStamp = [];
    this.rawSpeed = 0;
    this.lastEvent = "";
    this.moveHandler = this.moveHandler.bind(this);
  }

  public moveHandler(e: PointerEvent | Event) {
    if (e instanceof PointerEvent) {
      const point = {
        x: e.x - this.canvas.element.getBoundingClientRect().x,
        y: e.y - this.canvas.element.getBoundingClientRect().y,
      };

      this.path.unshift(point);
      this.timeStamp.unshift(e.timeStamp);
    } else if (this.lastEvent === e.type && this.path.length) {
      this.path.unshift(this.path[0]);
      this.timeStamp.unshift(e.timeStamp);
    }

    this.lastEvent = e.type;
  }

  public trim(ix: number) {
    this.path.splice(ix);
    this.timeStamp.splice(ix);
  }

  public setSpeed(window = 6) {
    window = Math.min(window, this.path.length - 1);
    if (window < 2) {
      this.rawSpeed = 0;
    }

    let travelled = 0;
    let time = 0;
    for (let i = 0; i < window; i++) {
      travelled += dist(this.path[i], this.path[i + 1]);
      time += this.timeStamp[i] - this.timeStamp[i + 1];
    }

    if (travelled === 0 || time === 0) {
      this.rawSpeed = 0;
    } else {
      this.rawSpeed = travelled / time;
    }
  }
}

export class Snek extends Cursor {
  segments: number;
  segLength: number;
  segmentPath: Path;
  snekWidth: number;
  speed: number;

  constructor(canvas: Canvas) {
    super(canvas);

    this.segments = 4;
    this.segLength = 50;
    this.snekWidth = 10;
    this.speed = 0;
    this.segmentPath = [
      {
        x: this.canvas.width / 2,
        y: this.canvas.height / 2,
      },
    ];
    for (let i = 0; i < this.segments; i++) {
      const nextSeg = {
        x: this.segmentPath[i].x,
        y: this.segmentPath[i].y + this.segLength,
      };

      this.segmentPath.push(nextSeg);
    }
  }

  public moveHandler(e: PointerEvent | Event) {
    super.moveHandler(e);
    this.calculateSegments();
    this.setSpeed();
  }

  public calculateSegments() {
    Object.assign(this.segmentPath, this.path, { length: 1 });
    let segHead = this.segmentPath[this.segmentPath.length - 1];
    for (let [ix, p] of this.path.entries()) {
      if (this.segmentPath.length <= this.segments) {
        while (this.segLength < dist(segHead, p)) {
          const seg = [this.path[ix - 1], p];
          const arc = {
            center: segHead,
            radius: this.segLength,
          };
          segHead = intersection(seg, arc) as Point;
          this.segmentPath.push(segHead);
          if (this.segments < this.segmentPath.length) {
            break;
          }
        }
      } else {
        if (this.segLength * 2 <= dist(segHead, p)) {
          super.trim(ix);
        }
      }
    }
  }

  public setSpeed(window = 6) {
    super.setSpeed(window);

    const alpha = 0.05;
    this.speed = alpha * this.rawSpeed + (1 - alpha) * this.speed;
  }

  public grow() {
    this.segments += 1;
  }
}

export class Pellet {
  target: HTMLCanvasElement;
  loc: Point;
  radius: number;

  constructor(target: HTMLCanvasElement) {
    this.radius = 15;
    this.target = target;
    this.loc = Object.create({});
  }

  // Choose random point within target until
  // no walls or snek within buffer range
  place(noGo: Path, buffer = 30) {
    if (noGo !== undefined) {
      noGo = noGo;
    }

    let loc: Point;
    let locValid: boolean;

    while (true) {
      locValid = true;
      loc = {
        x: randomBetween(buffer, this.target.clientWidth - buffer),
        y: randomBetween(buffer, this.target.clientHeight - buffer),
      };

      // loc is fine if there is no noGo
      if (noGo.length === 0) {
        this.loc = loc;
        break;
      }

      // Check if loc within buffer distance of noGo path.
      for (let i = 0; i < noGo.length - 1; i++) {
        if (
          intersection([noGo[i], noGo[i + 1]], {
            center: loc,
            radius: this.radius + buffer,
          })
        ) {
          // loc is too close to noGo, try again.
          locValid = false;
          break;
        }
      }

      if (locValid) {
        Object.assign(this.loc!, loc);
        // this.loc = loc;
        break;
      }
    }
  }
}
