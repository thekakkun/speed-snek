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
  | ["tooslow", Ui];

interface Mediator {
  notify(notification: Notification): void;
}

export class ConcreteMediator implements Mediator {
  private cursor: Cursor;
  private snek: Snek;
  private pellet: Pellet;
  public ui: Ui;

  constructor(cursor: Cursor, snek: Snek, pellet: Pellet, ui: Ui) {
    this.cursor = cursor;
    this.cursor.setMediator(this);
    this.snek = snek;
    this.snek.setMediator(this);
    this.pellet = pellet;
    this.pellet.setMediator(this);
    this.ui = ui;
    this.ui.setMediator(this);
  }

  public notify(notification: Notification): void {
    const [event, sender] = notification;

    switch (event) {
      case "pointermove":
        this.snek.update(sender);
        this.checkCollision();
        this.ui.setSpeed(sender);
        break;

      case "trimpath":
        const [, , ix] = notification;
        this.cursor.trim(ix);
        break;

      case "eatpellet":
        console.log("nom!");
        this.snek.grow();
        this.ui.update();
        this.pellet.place(this.snek.snekPath);
        break;

      case "hitself":
        console.log("ouch!");
        this.ui.gameOver(event);
        break;

      case "hitwall":
        console.log("whoops!");
        this.ui.gameOver(event);
        break;

      case "tooslow":
        console.log("faster!");
        this.ui.gameOver(event);
        break;

      default:
        const _exhaustiveCheck: never = sender;
        return _exhaustiveCheck;
    }
  }

  checkCollision() {
    const snekHead = this.snek.snekPath[0];

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
      this.cursor.target.width - 1 <= snekHead.x ||
      snekHead.y - 1 <= 0 ||
      this.cursor.target.height - 1 <= snekHead.y
    ) {
      this.notify(["hitwall", this]);
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
      }
    }
  }
}

abstract class GameObject {
  protected mediator: Mediator;

  constructor(mediator?: Mediator) {
    this.mediator = mediator!;
  }

  public setMediator(mediator: Mediator): void {
    this.mediator = mediator;
  }
}

export class Cursor extends GameObject {
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

export class Snek extends GameObject {
  segments: number;
  segLength: number;
  snekPath: Path;
  snekWidth: number;

  constructor(startLoc: Point, segments = 4, segLength = 50, snekWidth = 10) {
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

  public grow() {
    this.segments += 1;
  }
}

export class Pellet extends GameObject {
  noGo: Path;
  bb: [Point, Point];
  loc: Point;
  r: number;
  buffer: number;

  constructor(noGo: Path, bb: [Point, Point], r = 8, buffer = 30) {
    super();
    this.noGo = noGo;
    this.bb = bb;
    this.r = r;
    this.buffer = buffer;
    this.place();
  }

  place(noGo?: Path, bb?: [Point, Point]) {
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
}

export class Ui extends GameObject {
  score: number;
  speedLimit: number;
  maxSpeed: number;
  speed: number;
  smoothSpeed: number;

  constructor(score = 0, speedLimit = 0, maxSpeed = 10) {
    super();

    this.score = score;
    this.speedLimit = speedLimit;
    this.maxSpeed = maxSpeed;
    this.speed = speedLimit;
    this.smoothSpeed = speedLimit;
  }

  update() {
    this.score += 1;
    this.speedLimit += 0.1;
  }

  setSpeed(cursor: Cursor) {
    const alpha = 0.1;
    this.speed = cursor.getSpeed();
    if (this.speed !== NaN) {
      this.smoothSpeed = alpha * this.speed + (1 - alpha) * this.smoothSpeed;
    }
  }

  gameOver(reason: Notification[0]) {
    // alert(`Game Over!\n${reason}\nYour score: ${this.score}`);
    // location.reload();
  }
}
