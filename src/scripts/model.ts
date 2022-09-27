import { dist, intersection, Path, Point } from "./geometry";

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

type Notification = ["pointermove", Cursor] | ["trimpath", Snek, number];

interface Mediator {
  notify(notification: Notification): void;
}

// events are sent here, and the mediator passes them on to the correct handler.
export class Model implements Mediator {
  private cursor: Cursor;
  private snek: Snek;
  private pellet: Pellet;

  constructor(cursor: Cursor, snek: Snek, pellet: Pellet) {
    this.cursor = cursor;
    this.cursor.setMediator(this);
    this.snek = snek;
    this.snek.setMediator(this);
    this.pellet = pellet;
    this.pellet.setMediator(this);
  }

  public notify(notification: Notification): void {
    const [event, sender] = notification;

    switch (event) {
      case "pointermove":
        this.snek.update(sender);
        this.cursor.updateSpeed();
        break;

      case "trimpath":
        // Only keep enough raw path data to add another snek segment
        const [, , ix] = notification;
        this.cursor.trim(ix);
        break;

      default:
        const _exhaustiveCheck: never = sender;
        return _exhaustiveCheck;
    }
  }

  gameOver(reason: Notification[0], cursor: Cursor) {
    const message = {
      hitself: "You crashed into yourself!",
      hitwall: "You crashed into a wall!",
      tooslow: "You were too slow!",
    };

    localStorage.setItem("bestScore", String("this.bestScore"));

    if (process.env.NODE_ENV === "production") {
      document.removeEventListener("pointermove", cursor.moveHandler);
      alert(`Game Over!\n${message[reason]}\nYour score: ${this.score}`);
      location.reload();
    }
  }
}

// Components contain some sort of logic and can reference their mediators
// Things in the game that have data that need updating.
abstract class Component {
  protected mediator: Mediator;

  constructor(mediator?: Mediator) {
    this.mediator = mediator!;
  }

  public setMediator(mediator: Mediator): void {
    this.mediator = mediator;
  }
}

export class Cursor extends Component {
  target: HTMLCanvasElement;
  path: Path;
  timeStamp: number[];
  rawSpeed: number;
  speed: number;

  constructor(target: HTMLCanvasElement) {
    super();
    this.target = target;
    this.path = [];
    this.timeStamp = [];
    this.rawSpeed = 0;
    this.speed = 0;
    this.moveHandler = this.moveHandler.bind(this);
  }

  public moveHandler(e: PointerEvent) {
    const gameWrapper = this.target.parentElement as HTMLElement;

    const point = {
      x: e.x - gameWrapper.offsetLeft - gameWrapper.clientLeft,
      y: e.y - gameWrapper.offsetTop - gameWrapper.clientTop,
    };

    this.path.unshift(point);
    this.timeStamp.unshift(e.timeStamp);
    this.mediator.notify(["pointermove", this]);
  }

  public trim(ix: number) {
    this.path.splice(ix);
    this.timeStamp.splice(ix);
  }

  public getSpeed(window = 6) {
    window = Math.min(window, this.path.length - 1);
    if (window < 2) {
      return 0;
    }

    let travelled = 0;
    let time = 0;
    for (let i = 0; i < window; i++) {
      travelled += dist(this.path[i], this.path[i + 1]);
      time += this.timeStamp[i] - this.timeStamp[i + 1];
    }

    return travelled / time;
  }

  public updateSpeed() {
    const alpha = 0.05;
    this.rawSpeed = this.getSpeed();
    if (this.rawSpeed !== NaN) {
      this.speed = alpha * this.rawSpeed + (1 - alpha) * this.speed;
    }
  }
}

export class Snek extends Component {
  segments: number;
  segLength: number;
  path: Path;
  snekWidth: number;

  constructor(startLoc: Point) {
    super();
    this.segments = 4;
    this.segLength = 50;
    this.snekWidth = 10;

    this.path = [startLoc];
    for (let i = 0; i < this.segments; i++) {
      const nextSeg = {
        x: this.path[i].x,
        y: this.path[i].y + this.segLength,
      };

      this.path.push(nextSeg);
    }
  }

  public update(cursor: Cursor) {
    const cursorPath = cursor.path;
    Object.assign(this.path, cursorPath, { length: 1 });
    let segHead = this.path[this.path.length - 1];
    for (let [ix, p] of cursorPath.entries()) {
      if (this.path.length <= this.segments) {
        while (this.segLength < dist(segHead, p)) {
          const seg = [cursorPath[ix - 1], p];
          const arc = {
            center: segHead,
            radius: this.segLength,
          };
          segHead = intersection(seg, arc) as Point;
          this.path.push(segHead);
          if (this.segments < this.path.length) {
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

  public grow() {
    this.segments += 1;
  }
}

export class Pellet extends Component {
  target: HTMLCanvasElement;
  loc: Point;
  r: number;

  constructor(target: HTMLCanvasElement) {
    super();

    this.r = 15;
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
            radius: this.r + buffer,
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
