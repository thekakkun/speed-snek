interface Point {
  x: number;
  y: number;
}

type Path = Point[];

function dist(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function intersection(
  p1: Point,
  p2: Point,
  center: Point,
  radius: number
): Point {
  const { x: x1, y: y1 } = p1;
  const { x: x2, y: y2 } = p2;
  const { x: xc, y: yc } = center;

  const a = (x1 - x2) ** 2 + (y1 - y2) ** 2;
  const b = 2 * (x1 - x2) * (x2 - xc) + 2 * (y1 - y2) * (y2 - yc);
  const c = (x2 - xc) ** 2 + (y2 - yc) ** 2 - radius ** 2;

  let t: number;
  t = (-b - Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a);

  if (t < 0 || 1 < t) {
    t = (-b + Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a);
  }

  return {
    x: t * x1 + (1 - t) * x2,
    y: t * y1 + (1 - t) * y2,
  };
}

class SpeedSnek {
  board: Board;

  constructor(board: Board) {
    this.board = board;
  }

  init() {
    canvas.addEventListener(
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
  }

  draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.board.snek.draw();

    myReq = requestAnimationFrame(() => this.draw());
  }
}

class Board {
  snek: Snek;

  constructor(snek: Snek) {
    this.snek = snek;
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

  constructor(segments = 3, segLength = 30) {
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
  }

  update() {
    this.snekPath = [this.path[0]];
    let segHead = this.snekPath[this.snekPath.length - 1];
    for (let [ix, p2] of this.path.entries()) {
      if (this.snekPath.length <= this.segments) {
        if (this.segLength <= dist(segHead, p2)) {
          const p1 = this.path[ix - 1];
          segHead = intersection(p1, p2, segHead, this.segLength);
          this.snekPath.push(segHead);
        }
      } else {
        if (this.segLength * 3 <= dist(segHead, p2)) {
          this.path = this.path.slice(0, ix);
          break;
        }
      }
    }
  }

  draw() {
    super.draw();
    this.update();

    ctx.strokeStyle = "green";
    ctx.lineWidth = 3;
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
  constructor(loc: Point) {
    this.loc = loc;
  }

  draw() {}
}

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
let myReq: number;

const snek = new Snek();
const board = new Board(snek);
const speedSnek = new SpeedSnek(board);
speedSnek.init();
