import { dist, intersection, Path, Point } from "./geometry";

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

type Notification =
  | ["pointermove", Cursor]
  | ["trimpath", Snek, number]
  | ["eatpellet", ConcreteMediator]
  | ["hitself", ConcreteMediator]
  | ["hitwall", ConcreteMediator]
  | ["tooslow", SpeedSnek];

interface Mediator {
  notify(notification: Notification): void;
}

// events are sent here, and the mediator passes them on to the correct handler.
export class ConcreteMediator implements Mediator {
  public speedSnek: SpeedSnek;
  private cursor: Cursor;
  private snek: Snek;
  private pellet: Pellet;

  constructor(
    speedSnek: SpeedSnek,
    cursor: Cursor,
    snek: Snek,
    pellet: Pellet
  ) {
    this.speedSnek = speedSnek;
    this.speedSnek.setMediator(this);
    this.cursor = cursor;
    this.cursor.setMediator(this);
    this.snek = snek;
    this.snek.setMediator(this);
    this.pellet = pellet;
    this.pellet.setMediator(this);
  }

  public notify(notification: Notification): void {
    const [event, sender, ...args] = notification;

    switch (event) {
      case "pointermove":
        this.snek.update(sender);
        this.checkCollision();
        this.speedSnek.updateSpeed(sender);
        break;

      case "trimpath":
        const [, , ix] = notification;
        this.cursor.trim(ix);
        break;

      case "eatpellet":
        console.log("nom!");
        this.snek.grow();
        this.speedSnek.update();
        this.pellet.place(this.snek.path);
        break;

      case "hitself":
        console.log("ouch!");
        this.speedSnek.gameOver(event);
        break;

      case "hitwall":
        console.log("whoops!");
        this.speedSnek.gameOver(event);
        break;

      case "tooslow":
        console.log("faster!");
        this.speedSnek.gameOver(event);
        break;

      default:
        const _exhaustiveCheck: never = sender;
        return _exhaustiveCheck;
    }
  }

  checkCollision() {
    const snekHead = this.snek.path[0];

    // snek vs pellet collisions
    if (
      2 <= this.cursor.path.length &&
      intersection([this.cursor.path[0], this.cursor.path[1]], {
        center: this.pellet.loc,
        radius: this.pellet.r + this.snek.snekWidth / 2,
      })
    ) {
      this.notify(["eatpellet", this]);
    }

    // // snek vs wall collisions
    if (
      snekHead.x - 1 <= 0 ||
      this.cursor.target.clientWidth - 1 <= snekHead.x ||
      snekHead.y - 1 <= 0 ||
      this.cursor.target.clientHeight - 1 <= snekHead.y
    ) {
      this.notify(["hitwall", this]);
    }

    // snek vs snek collisions
    for (let i = 2; i < this.snek.path.length - 1; i++) {
      if (
        intersection(
          [this.snek.path[0], this.snek.path[1]],
          [this.snek.path[i], this.snek.path[i + 1]]
        )
      ) {
        this.notify(["hitself", this]);
      }
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

export class SpeedSnek extends Component {
  score: number;
  maxScore: number;
  speedLimit: number;
  speedIncrease: number;
  maxSpeed: number;
  speed: number;
  smoothSpeed: number;

  constructor(score = 0, speedLimit = 0, speedIncrease = 0.08, maxSpeed = 5) {
    super();

    this.score = score;
    const maxScore = localStorage.getItem("maxScore");
    this.maxScore = this.maxScore ? Number(maxScore) : 0;
    this.speedLimit = speedLimit;
    this.speedIncrease = speedIncrease;
    this.maxSpeed = maxSpeed;
    this.speed = speedLimit;
    this.smoothSpeed = speedLimit;
  }

  update() {
    this.score += 1;
    this.maxScore = Math.max(this.maxScore, this.score);
    this.speedLimit = Math.min(
      this.speedLimit + this.speedIncrease,
      this.maxSpeed
    );
  }

  updateSpeed(cursor: Cursor) {
    const alpha = 0.1;
    this.speed = cursor.getSpeed();
    if (this.speed !== NaN) {
      this.smoothSpeed = alpha * this.speed + (1 - alpha) * this.smoothSpeed;
    }

    if (this.smoothSpeed < this.speedLimit) {
      this.mediator.notify(["tooslow", this]);
    }
  }

  gameOver(reason: Notification[0]) {
    const message = {
      hitself: "You crashed into yourself!",
      hitwall: "You crashed into a wall!",
      tooslow: "You were too slow!",
    };
    
    localStorage.setItem("maxScore", String(this.maxScore));

    if (process.env.NODE_ENV === "production") {
      alert(`Game Over!\n${message[reason]}\nYour score: ${this.score}`);
      location.reload();
    }
  }
}

export class Cursor extends Component {
  path: Path;
  timeStamp: number[];
  target: HTMLCanvasElement;

  constructor(target: HTMLCanvasElement) {
    super();
    this.path = [];
    this.timeStamp = [];
    this.target = target;
    this.moveHandler = this.moveHandler.bind(this);
  }

  public moveHandler(e: PointerEvent) {
    const point = {
      x: e.x - this.target.offsetLeft,
      y: e.y - this.target.offsetTop,
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
}

export class Snek extends Component {
  segments: number;
  segLength: number;
  path: Path;
  snekWidth: number;

  constructor(startLoc: Point, segments = 4, segLength = 50, snekWidth = 10) {
    super();

    this.path = [startLoc];
    for (let i = 0; i < segments; i++) {
      const nextSeg = {
        x: this.path[i].x,
        y: this.path[i].y + segLength,
      };

      this.path.push(nextSeg);
    }

    this.segments = segments;
    this.segLength = segLength;
    this.snekWidth = snekWidth;
  }

  public update(cursor: Cursor) {
    const cursorPath = cursor.path;
    this.path = [cursorPath[0]];
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

  constructor(target: HTMLCanvasElement, noGo: Path, r = 15) {
    super();

    this.r = r;
    this.target = target;
    this.place(noGo);
  }

  // Choose random points within bb (bounding box) until no walls or snek
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

      // Place is fine if there is no noGo
      if (noGo.length === 0) {
        this.loc = loc;
        break;
      }

      // Check if pellet location within buffer distance of noGo path.
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
        this.loc = loc;
        break;
      }
    }
  }
}
