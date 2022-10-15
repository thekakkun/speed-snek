import { dist, intersection, Path, Point } from "./geometry";
import { Canvas } from "./graphics";

/**
 * Return a random number between min and max.
 * @param min Smallest value number can take (inclusive).
 * @param max Largest value number can take (exclusive).
 * @returns A random number between min and max.
 */
function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

/**
 * Holds information about the user's pointer movement.
 */
export class Pointer {
  canvas: Canvas;
  path: Path;
  timeStamp: DOMHighResTimeStamp[];
  speed: number;

  /**
   * Constructs a Pointer.
   * @param canvas The canvas element capturing pointer info.
   */
  constructor(canvas: Canvas) {
    this.canvas = canvas;
    this.path = [];
    this.timeStamp = [];
    this.speed = 0;
    this.moveHandler = this.moveHandler.bind(this);
  }

  /**
   * Handles incoming events and adds the data to Pointer.
   * @param e The event, PointerEvent if triggered by 'pointermove'
   * and Event if triggered by 'render'.
   */
  public moveHandler(e: PointerEvent) {
    const point = {
      x: e.offsetX,
      y: e.offsetY,
    };

    this.path.unshift(point);
    this.timeStamp.unshift(e.timeStamp);
    this.setSpeed();
  }

  /**
   * Trims unnecessary data in path and timeStamp.
   * Meant to only leave enough to calculate the position of a newly added segment.
   * @param ix The index of the last necessary point in path.
   */
  public trim(ix: number) {
    this.path.splice(ix);
    this.timeStamp.splice(ix);
  }

  /**
   * Calculates and sets the speed based off of path and timeStamp,
   */
  public setSpeed() {
    if (this.path.length < 2) {
      this.speed = 0;
    } else {
      const frameTime = 1000 / 60;
      let tDelta = 0;
      let distance = 0;
      let i = 0;

      while (tDelta < frameTime) {
        tDelta += this.timeStamp[i] - this.timeStamp[i + 1];
        distance += dist(this.path[i], this.path[i + 1]);
        i++;
      }

      this.speed = distance / tDelta;
    }
  }
}

/**
 * Holds information about the Snek.
 * @extends Pointer
 */
export class Snek extends Pointer {
  segments: number;
  segLength: number;
  segmentPath: Path;
  snekWidth: number;

  /**
   * Constructs a Snek.
   * @param canvas The canvas element capturing pointer info.
   */
  constructor(canvas: Canvas, scale?: number) {
    super(canvas);
    scale = scale ?? 1;

    this.segments = 4;
    this.segLength = 50 * scale;
    this.snekWidth = 10 * scale;
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
      this.path.push(nextSeg);
      this.timeStamp.unshift(i);
    }
  }

  /**
   * Handles incoming events and updates Snek properties.
   * @param e The event, PointerEvent if triggered by 'pointermove'
   * and Event if triggered by 'render'.
   */
  public moveHandler(e: PointerEvent) {
    super.moveHandler(e);
    this.calculateSegments();
  }

  /** Calculate the position of the segments, based on path. */
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

          segHead = intersection(seg, arc) ?? p;

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

  public grow() {
    this.segments += 1;
  }
}

/**
 * Holds information about the Pellet.
 */
export class Pellet {
  canvas: Canvas;
  loc: Point;
  radius: number;

  /**
   * Construct a Pellet.
   * @param canvas The Canvas object where pellet is placed.
   */
  constructor(canvas: Canvas, scale?: number) {
    scale = scale ?? 1;

    this.radius = 15 * scale;
    this.canvas = canvas;
    this.loc = Object.create({});
  }

  /**
   * Choose a location to place the pellet within the canvas.
   * Must not be within buffer range from canvas borders or noGo path.
   * @param noGo Path where no pellet can be placed within buffer range.
   * @param buffer The size of the buffer.
   */
  place(noGo?: Path, buffer = 30) {
    let loc: Point;
    let locValid: boolean;

    while (true) {
      locValid = true;
      loc = {
        x: randomBetween(buffer, this.canvas.width - buffer),
        y: randomBetween(buffer, this.canvas.height - buffer),
      };

      // loc is fine if there is no noGo
      if (noGo === undefined) {
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
        break;
      }
    }

    Object.assign(this.loc, loc);
  }
}
