import { dist, intersection, Path, Point } from "./geometry";
import { GraphicsComponent } from "./graphics";

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

type Notification =
  | ["pointermove", Cursor]
  | ["trimpath", Snek, number]
  | ["eatpellet", SpeedSnek]
  | ["hitself", SpeedSnek]
  | ["hitwall", SpeedSnek]
  | ["tooslow", Ui];

interface Mediator {
  notify(notification: Notification): void;
}

export class SpeedSnek implements Mediator {
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
        this.pellet.placePellet(this.snek.snekPath);
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
        console.log("too slow!");
        this.ui.gameOver(event);
        break;

      default:
        const _exhaustiveCheck: never = sender;
        return _exhaustiveCheck;
    }
  }

  checkCollision() {
    if (this.cursor.target === undefined) {
      throw "Draw target is undefined";
    }

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
  target!: HTMLCanvasElement; // Should come from GraphicsComposite

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

  public getSpeed(window = 50) {
    window = Math.min(window, this.path.length - 1);
    let travelled = 0;
    for (let i = 0; i < window; i++) {
      travelled += dist(this.path[i], this.path[i + 1]);
    }

    return travelled / window;
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

  placePellet(noGo?: Path, bb?: [Point, Point]) {
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

  constructor(score = 0, speedLimit = 0, maxSpeed = 80) {
    super();

    this.score = score;
    this.speedLimit = speedLimit;
    this.maxSpeed = maxSpeed;
    this.speed = maxSpeed;
    this.smoothSpeed = maxSpeed;
  }

  draw() {
    if (this.target === undefined) {
      throw "Draw target is undefined";
    }

    const context = this.target.getContext("2d") as CanvasRenderingContext2D;

    const needleLoc = (this.target.width * this.smoothSpeed) / this.maxSpeed;
    context.fillStyle = "green";
    context.beginPath();
    context.moveTo(needleLoc, 50);
    context.lineTo(needleLoc - 5, 0);
    context.lineTo(needleLoc + 5, 0);
    context.fill();

    context.strokeStyle = "orangeRed";
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo((this.target.width * this.speedLimit) / this.maxSpeed, 0);
    context.lineTo((this.target.width * this.speedLimit) / this.maxSpeed, 50);
    context.stroke();
  }

  update() {
    this.score += 1;
    this.speedLimit += 1;
  }

  setSpeed(cursor: Cursor) {
    let currentSpeed = cursor.getSpeed();
    this.smoothSpeed < currentSpeed ? this.smoothSpeed++ : this.smoothSpeed--;

    if (this.smoothSpeed < this.speedLimit) {
      this.mediator.notify(["tooslow", this]);
    }
  }

  gameOver(reason: string) {
    alert(`Game Over!\n${reason}\nYour score: ${this.score}`);
    location.reload();
  }
}
