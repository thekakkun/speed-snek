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

function intersection(seg1: Path, arc: Arc): Point;
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

    let t: number;
    t = (-b - Math.sqrt(b ** 2 - a * c)) / a;

    if (!(0 <= t && t <= 1)) {
      t = (-b + Math.sqrt(b ** 2 - a * c)) / a;
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
  board: Board;

  constructor() {
    this.board = new Board();

    document.addEventListener(
      "pointermove",
      (e) => this.pointerMoveHandler(e),
      false
    );

    this.draw();
  }

  pointerMoveHandler(e: PointerEvent) {
    const coord: Point = {
      x: e.x - canvas.offsetLeft,
      y: e.y - canvas.offsetTop,
    };

    this.board.snek.add(coord);
    this.update();
  }

  update() {
    this.board.update();
  }

  draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.board.draw();

    myReq = requestAnimationFrame(() => this.draw());
  }
}

class Board {
  snek: Snek;
  pellet: Pellet;

  constructor() {
    this.snek = new Snek();
    this.pellet = this.createPellet();
  }

  update() {
    this.snek.update();
    this.checkCollisions();
  }

  draw() {
    this.snek.draw();
    this.pellet.draw();
  }

  checkCollisions() {
    const snekHead = this.snek.snekPath[0];

    // snek vs pellet collisions
    if (
      dist(snekHead, this.pellet.loc) <=
      this.pellet.r + this.snek.snekWidth / 2
    ) {
      this.snek.segments += 1;
      this.pellet = this.createPellet();
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

  createPellet() {
    const buffer = 30;
    const loc = {
      x: Math.random() * (canvas.width - buffer * 2) + buffer,
      y: Math.random() * (canvas.height - buffer * 2) + buffer,
    };
    const pellet = new Pellet(loc);
    pellet.draw();

    return pellet;
  }
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
}

class Snek extends Cursor {
  segments: number;
  segLength: number;
  snekPath: Path;
  snekWidth: number;

  constructor(segments = 50, segLength = 30, snekWidth = 5) {
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
          segHead = intersection(seg, arc);
          this.snekPath.push(segHead);

          if (this.segments < this.snekPath.length) {
            break;
          }
        }
      } else {
        if (this.segLength * 1.5 <= dist(segHead, p)) {
          this.path.splice(ix);
          break;
        }
      }
    }
  }

  draw() {
    super.draw();

    ctx.strokeStyle = "green";
    ctx.lineWidth = this.snekWidth;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(this.snekPath[0].x, this.snekPath[0].y);
    this.snekPath.forEach((point: Point) => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
  }
}

class Pellet {
  loc: Point;
  r: number;

  constructor(loc: Point, r = 8) {
    this.loc = loc;
    this.r = r;
  }

  draw() {
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.arc(this.loc.x, this.loc.y, this.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
let myReq: number;

const speedSnek = new SpeedSnek();
