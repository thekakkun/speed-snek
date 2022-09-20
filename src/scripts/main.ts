import { SpeedSnek, Cursor, Snek } from "./objects";
import { GraphicsComposite } from "./graphics";

const gameCanvas = document.getElementById("game") as HTMLCanvasElement;
const uiCanvas = document.getElementById("ui") as HTMLCanvasElement;

const startLoc = {
  x: gameCanvas.width / 2,
  y: gameCanvas.height / 2,
};

const cursor = new Cursor(gameCanvas);
const snek = new Snek(startLoc);
const gameModel = new SpeedSnek(cursor, snek);

const gameGraphics = new GraphicsComposite(gameCanvas);
gameGraphics.add(cursor);
gameGraphics.add(snek);

const uiGraphics = new GraphicsComposite(uiCanvas);

const graphics = new GraphicsComposite();
graphics.add(gameGraphics);
graphics.add(uiGraphics);

document.addEventListener("pointermove", (e) => {
  cursor.moveListener(e);
});

let draw = () => {
  graphics.draw();
  graphics.reqId = requestAnimationFrame(draw);
};
draw();

// requestAnimationFrame(graphics.draw);

// const gameCanvas = document.getElementById("game") as HTMLCanvasElement;
// const gameCtx = gameCanvas.getContext("2d") as CanvasRenderingContext2D;

// function dist(p1: Point, p2: Point): number {
//   return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
// }

// function intersection(seg1: Path, arc: Arc): Point | false;
// function intersection(seg1: Path, seg2: Path): Point | false;
// function intersection(seg1: Path, seg2: Arc | Path): Point | false {
//   if ("center" in seg2) {
//     const [{ x: x1, y: y1 }, { x: x2, y: y2 }] = seg1;
//     const {
//       center: { x: xc, y: yc },
//       radius,
//     } = seg2;

//     const a = (x1 - x2) ** 2 + (y1 - y2) ** 2;
//     const b = (x1 - x2) * (x2 - xc) + (y1 - y2) * (y2 - yc);
//     const c = (x2 - xc) ** 2 + (y2 - yc) ** 2 - radius ** 2;

//     const discriminant = b ** 2 - a * c;
//     if (discriminant < 0) {
//       return false;
//     }

//     let t: number;
//     t = (-b - Math.sqrt(discriminant)) / a;

//     if (!(0 <= t && t <= 1)) {
//       // getting the other intersection
//       t = (-b + Math.sqrt(discriminant)) / a;
//     }
//     if (!(0 <= t && t <= 1)) {
//       // t still out of range? then no intersection.
//       return false;
//     }

//     return {
//       x: t * x1 + (1 - t) * x2,
//       y: t * y1 + (1 - t) * y2,
//     };
//   } else {
//     const [{ x: x1, y: y1 }, { x: x2, y: y2 }] = seg1;
//     const [{ x: x3, y: y3 }, { x: x4, y: y4 }] = seg2;

//     const t =
//       ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) /
//       ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
//     if (!(0 <= t && t <= 1)) {
//       return false;
//     }

//     const u =
//       ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) /
//       ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
//     if (!(0 <= u && u <= 1)) {
//       return false;
//     }

//     return {
//       x: x1 + t * (x2 - x1),
//       y: y1 + t * (y2 - y1),
//     };
//   }
// }

// class SpeedSnek {
//   ui: UI;
//   board: Board;
//   // snek: Snek;
//   // pellet: Pellet;

//   score: number;
//   speed: number;
//   speedLim: number;

//   constructor(score = 0, speedLim = 100) {
//     this.ui = new UI();
//     this.board = new Board();
//     // this.snek = new Snek();
//     // this.pellet = new Pellet(undefined, undefined, this.snek.snekPath);

//     this.score = score;
//     this.speed = this.board.snek.getSpeed();
//     this.speedLim = speedLim;

//     this.draw = this.draw.bind(this);
//     this.pointerMoveHandler = this.pointerMoveHandler.bind(this);

//     document.addEventListener("pointermove", this.pointerMoveHandler);

//     this.draw();
//   }

//   update() {
//     this.board.update();
//     this.speed = this.board.snek.getSpeed();
//     // this.checkCollisions();
//   }

//   draw() {
//     gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
//     this.board.draw();
//     this.ui.draw(this.score, this.speed, this.speedLim);

//     myReq = requestAnimationFrame(this.draw);
//   }

//   pointerMoveHandler(e: PointerEvent) {
//     const coord: Point = {
//       x: e.x - gameCanvas.offsetLeft,
//       y: e.y - gameCanvas.offsetTop,
//     };

//     this.board.snek.add(coord);
//     this.update();
//   }

//   // checkCollisions() {
//   //   const snekHead = this.snek.snekPath[0];

//   //   // snek vs pellet collisions
//   //   // TODO: Check collision between line and arc, not line and snekHead.
//   //   //       Can pass through if too fast.
//   //   if (
//   //     dist(snekHead, this.pellet.loc) <=
//   //     this.pellet.r + this.snek.snekWidth / 2
//   //   ) {
//   //     console.log("nom!");
//   //     this.score += 1;
//   //     this.snek.segments += 1;
//   //     this.pellet = new Pellet(undefined, undefined, this.snek.snekPath);
//   //   }

//   //   // snek vs wall collisions
//   //   if (
//   //     snekHead.x - 1 <= 0 ||
//   //     canvas.width - 1 <= snekHead.x ||
//   //     snekHead.y - 1 <= 0 ||
//   //     canvas.height - 1 <= snekHead.y
//   //   ) {
//   //     console.log("whoops!");
//   //   }

//   //   // snek vs snek collisions
//   //   for (let i = 2; i < this.snek.snekPath.length - 1; i++) {
//   //     if (
//   //       intersection(
//   //         [this.snek.snekPath[0], this.snek.snekPath[1]],
//   //         [this.snek.snekPath[i], this.snek.snekPath[i + 1]]
//   //       )
//   //     ) {
//   //       console.log("ouch!");
//   //     }
//   //   }
//   // }
// }

// class UI {
//   draw(score: number, speed: number, speedLim: number) {
//     this.drawScore(score);
//     this.drawSpeed(speed, speedLim);
//   }

//   drawSpeed(speed: number, speedLim: number) {}

//   drawScore(score: number) {}
// }

// class Board {
//   snek: Snek;
//   pellet: Pellet;
//   area: [Point, Point];

//   constructor() {
//     this.snek = new Snek();
//     this.pellet = new Pellet(undefined, undefined, this.snek.snekPath);
//     this.area = [
//       { x: 0, y: 20 },
//       { x: gameCanvas.width, y: gameCanvas.height },
//     ];
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
//       snekHead.x - this.snek.snekWidth / 2 <= this.area[0].x ||
//       this.area[1].x - this.snek.snekWidth / 2 <= snekHead.x ||
//       snekHead.y - this.snek.snekWidth / 2 <= this.area[0].y ||
//       this.area[1].y - this.snek.snekWidth / 2 <= snekHead.y
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

// class Cursor {
//   path: Path;

//   constructor(path: Path = [{ x: 0, y: 0 }]) {
//     this.path = path;
//   }

//   draw() {
//     gameCtx.strokeStyle = "red";
//     gameCtx.lineWidth = 1;
//     gameCtx.beginPath();
//     gameCtx.moveTo(this.path[0].x, this.path[0].y);
//     this.path.forEach((point: Point) => {
//       gameCtx.lineTo(point.x, point.y);
//     });
//     gameCtx.stroke();
//   }

//   add(point: Point) {
//     this.path.unshift(point);
//   }

//   getSpeed(window = 3) {
//     // TODO: How is this influenced by screen resolution & scaling?
//     window = Math.min(window, this.path.length - 1);
//     let travelled = 0;
//     for (let i = 0; i < window; i++) {
//       travelled += dist(this.path[i], this.path[i + 1]);
//     }

//     return travelled / window;
//   }
// }

// class Snek extends Cursor {
//   segments: number;
//   segLength: number;
//   snekPath: Path;
//   snekWidth: number;

//   constructor(segments = 4, segLength = 50, snekWidth = 10) {
//     let initPath: Path = [];

//     for (let i = 0; i < segments + 1; i++) {
//       initPath.push({
//         x: gameCanvas.width / 2,
//         y: gameCanvas.height / 2 + i * segLength,
//       });
//     }

//     super(initPath);
//     this.segments = segments;
//     this.segLength = segLength;
//     this.snekPath = initPath.slice();
//     this.snekWidth = snekWidth;
//   }

//   update() {
//     this.snekPath = [this.path[0]];
//     let segHead = this.snekPath[this.snekPath.length - 1];
//     for (let [ix, p] of this.path.entries()) {
//       if (this.snekPath.length <= this.segments) {
//         while (this.segLength < dist(segHead, p)) {
//           const seg = [this.path[ix - 1], p];
//           const arc = {
//             center: segHead,
//             radius: this.segLength,
//           };
//           segHead = intersection(seg, arc) as Point;
//           this.snekPath.push(segHead);

//           if (this.segments < this.snekPath.length) {
//             break;
//           }
//         }
//       } else {
//         if (this.segLength * 2 <= dist(segHead, p)) {
//           this.path.splice(ix);
//           break;
//         }
//       }
//     }
//   }

//   draw() {
//     super.draw();

//     gameCtx.strokeStyle = "green";
//     gameCtx.lineCap = "round";
//     gameCtx.lineJoin = "round";
//     gameCtx.lineWidth = this.snekWidth;

//     gameCtx.beginPath();
//     gameCtx.moveTo(this.snekPath[0].x, this.snekPath[0].y);
//     this.snekPath.forEach((point: Point) => {
//       gameCtx.lineTo(point.x, point.y);
//     });
//     gameCtx.stroke();
//   }
// }

// class Pellet {
//   r: number;
//   buffer: number;
//   noGo?: Path;
//   loc: Point;

//   constructor(r = 8, buffer = 30, noGo?: Path) {
//     this.r = r;
//     this.buffer = buffer;
//     this.noGo = noGo;
//     this.loc = this.place();
//   }

//   draw() {
//     gameCtx.fillStyle = "blue";
//     gameCtx.beginPath();
//     gameCtx.arc(this.loc.x, this.loc.y, this.r, 0, Math.PI * 2);
//     gameCtx.fill();
//   }

//   place() {
//     let loc: Point;
//     let locValid: boolean;

//     while (true) {
//       locValid = true;
//       loc = {
//         x: Math.random() * (gameCanvas.width - this.buffer * 2) + this.buffer,
//         y: Math.random() * (gameCanvas.height - this.buffer * 2) + this.buffer,
//       };

//       if (this.noGo === undefined) {
//         return loc;
//       }

//       // Check if pellet location within buffer distance of noGo path.
//       for (let i = 0; i < this.noGo.length - 1; i++) {
//         if (
//           intersection([this.noGo[i], this.noGo[i + 1]], {
//             center: loc,
//             radius: this.r + this.buffer,
//           })
//         ) {
//           locValid = false;
//           break;
//         }
//       }

//       if (locValid) {
//         return loc;
//       }
//     }
//   }
// }

// let myReq: number;
