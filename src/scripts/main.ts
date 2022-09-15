interface Point {
  x: number;
  y: number;
}
interface Arc {
  center: Point;
  radius: number;
}
type Path = Point[];

function dist(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

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

class SpeedSnek {
  ui: UI;
  snek: Snek;
  pellet: Pellet;

  score: number;
  speed: number;
  speedLim: number;

  constructor(score = 0, speedLim = 100) {
    this.ui = new UI();
    this.snek = new Snek();
    this.pellet = new Pellet(undefined, undefined, this.snek.snekPath);

    this.score = score;
    this.speed = this.snek.getSpeed();
    this.speedLim = speedLim;

    this.draw = this.draw.bind(this);
    this.pointerMoveHandler = this.pointerMoveHandler.bind(this);

    document.addEventListener("pointermove", this.pointerMoveHandler);

    this.draw();
  }

  update() {
    this.snek.update();
    this.speed = this.snek.getSpeed();
    this.checkCollisions();
  }

  draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.snek.draw();
    this.pellet.draw();
    this.ui.draw(this.score, this.speed, this.speedLim);

    myReq = requestAnimationFrame(this.draw);
  }

  pointerMoveHandler(e: PointerEvent) {
    const coord: Point = {
      x: e.x - canvas.offsetLeft,
      y: e.y - canvas.offsetTop,
    };

    this.snek.add(coord);
    this.update();
  }

  checkCollisions() {
    const snekHead = this.snek.snekPath[0];

    // snek vs pellet collisions
    // TODO: Check collision between line and arc, not line and snekHead.
    //       Can pass through if too fast.
    if (
      dist(snekHead, this.pellet.loc) <=
      this.pellet.r + this.snek.snekWidth / 2
    ) {
      console.log("nom!");
      this.score += 1;
      this.snek.segments += 1;
      this.pellet = new Pellet(undefined, undefined, this.snek.snekPath);
    }

    // snek vs wall collisions
    if (
      snekHead.x - 1 <= 0 ||
      canvas.width - 1 <= snekHead.x ||
      snekHead.y - 1 <= 0 ||
      canvas.height - 1 <= snekHead.y
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
        console.log("ouch!");
      }
    }
  }
}

class UI {
  draw(score: number, speed: number, speedLim: number) {
    this.drawScore(score);
    this.drawSpeed(speed, speedLim);
  }

  drawSpeed(speed: number, speedLim: number) {}

  drawScore(score: number) {}
}

class Cursor {
  path: Path;

  constructor(path: Path = [{ x: 0, y: 0 }]) {
    this.path = path;
  }

  draw() {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.path[0].x, this.path[0].y);
    this.path.forEach((point: Point) => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
  }

  add(point: Point) {
    this.path.unshift(point);
  }

  getSpeed(window = 3) {
    // TODO: How is this influenced by screen resolution & scaling?
    window = Math.min(window, this.path.length - 1);
    let travelled = 0;
    for (let i = 0; i < window; i++) {
      travelled += dist(this.path[i], this.path[i + 1]);
    }

    return travelled / window;
  }
}

class Snek extends Cursor {
  segments: number;
  segLength: number;
  snekPath: Path;
  snekWidth: number;

  constructor(segments = 4, segLength = 50, snekWidth = 10) {
    let initPath: Path = [];

    for (let i = 0; i < segments + 1; i++) {
      initPath.push({
        x: canvas.width / 2,
        y: canvas.height / 2 + i * segLength,
      });
    }

    super(initPath);
    this.segments = segments;
    this.segLength = segLength;
    this.snekPath = initPath.slice();
    this.snekWidth = snekWidth;
  }

  update() {
    this.snekPath = [this.path[0]];
    let segHead = this.snekPath[this.snekPath.length - 1];
    for (let [ix, p] of this.path.entries()) {
      if (this.snekPath.length <= this.segments) {
        while (this.segLength < dist(segHead, p)) {
          const seg = [this.path[ix - 1], p];
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
          this.path.splice(ix);
          break;
        }
      }
    }
  }

  draw() {
    super.draw();

    ctx.strokeStyle = "green";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = this.snekWidth;

    ctx.beginPath();
    ctx.moveTo(this.snekPath[0].x, this.snekPath[0].y);
    this.snekPath.forEach((point: Point) => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
  }
}

class Pellet {
  r: number;
  buffer: number;
  noGo?: Path;
  loc: Point;

  constructor(r = 8, buffer = 30, noGo?: Path) {
    this.r = r;
    this.buffer = buffer;
    this.noGo = noGo;
    this.loc = this.place();
  }

  draw() {
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.arc(this.loc.x, this.loc.y, this.r, 0, Math.PI * 2);
    ctx.fill();
  }

  place() {
    let loc: Point;
    let locValid: boolean;

    while (true) {
      locValid = true;
      loc = {
        x: Math.random() * (canvas.width - this.buffer * 2) + this.buffer,
        y: Math.random() * (canvas.height - this.buffer * 2) + this.buffer,
      };

      if (this.noGo === undefined) {
        return loc;
      }

      // Check if pellet location within buffer distance of noGo path.
      for (let i = 0; i < this.noGo.length - 1; i++) {
        if (
          intersection([this.noGo[i], this.noGo[i + 1]], {
            center: loc,
            radius: this.r + this.buffer,
          })
        ) {
          locValid = false;
          break;
        }
      }

      if (locValid) {
        return loc;
      }
    }
  }
}

// class Board {
//   snek: Snek;
//   pellet: Pellet;

//   constructor() {
//     this.snek = new Snek();
//     this.pellet = new Pellet(undefined, undefined, this.snek.snekPath);
//   }

//   update() {
//     this.snek.update();
//     this.checkCollisions();
//   }

//   draw() {
//     this.snek.draw();
//     this.pellet.draw();
//   }

//   checkCollisions() {
//     const snekHead = this.snek.snekPath[0];

//     // snek vs pellet collisions
//     // TODO: Check collision between line and arc, not line and snekHead.
//     //       Can pass through if too fast.
//     if (
//       dist(snekHead, this.pellet.loc) <=
//       this.pellet.r + this.snek.snekWidth / 2
//     ) {
//       this.snek.segments += 1;
//       this.pellet = new Pellet(undefined, undefined, this.snek.snekPath);
//     }

//     // snek vs wall collisions
//     if (
//       snekHead.x - 1 <= 0 ||
//       canvas.width - 1 <= snekHead.x ||
//       snekHead.y - 1 <= 0 ||
//       canvas.height - 1 <= snekHead.y
//     ) {
//       console.log("whoops!");
//     }

//     // snek vs snek collisions
//     for (let i = 2; i < this.snek.snekPath.length - 1; i++) {
//       if (
//         intersection(
//           [this.snek.snekPath[0], this.snek.snekPath[1]],
//           [this.snek.snekPath[i], this.snek.snekPath[i + 1]]
//         )
//       ) {
//         console.log("ouch!");
//       }
//     }
//   }
// }

let myReq: number;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const speedSnek = new SpeedSnek();
