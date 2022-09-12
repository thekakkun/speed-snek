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
    console.log("redo!");
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
    this.board.snek.drawSnek();
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

  constructor(segments = 3, segLength = 40) {
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
    for (let [ix, e] of this.path.entries()) {
      if (this.segLength <= dist(segHead, e)) {
        segHead = intersection(this.path[ix - 1], e, segHead, this.segLength);

        if (this.snekPath.push(segHead) === this.segments + 1) {
          break;
        }
      }
    }
  }

  drawSnek() {
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

class Pellet {}

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
let myReq: number;

const snek = new Snek();
const board = new Board(snek);
const speedSnek = new SpeedSnek(board);
speedSnek.init();

// type Block = Point & {
//   status: number;
// };

// let myReq: number;

// let ballPos: Point = { x: canvas.width / 2, y: canvas.height - 30 };
// let ballVel: Point = { x: 2, y: -2 };

// const ballRadius = 10;

// const paddleHeight = 10;
// const paddleWidth = 75;
// let paddleX = (canvas.width - paddleWidth) / 2;

// let rightPressed = false;
// let leftPressed = false;

// const brickRowCount = 3;
// const brickColumnCount = 5;
// const brickWidth = 75;
// const brickHeight = 20;
// const brickPadding = 10;
// const brickOffsetTop = 30;
// const brickOffsetLeft = 30;

// let lives = 3;
// let score = 0;

// const bricks: Block[][] = [];
// for (let c = 0; c < brickColumnCount; c++) {
//   bricks[c] = [];
//   for (let r = 0; r < brickRowCount; r++) {
//     bricks[c][r] = { x: 0, y: 0, status: 1 };
//   }
// }

// function drawBall() {
//   ctx.beginPath();
//   ctx.arc(ballPos.x, ballPos.y, ballRadius, 0, Math.PI * 2);
//   ctx.fillStyle = "#0095dd";
//   ctx.fill();
//   ctx.closePath();
// }

// document.addEventListener("keydown", keyDownHandler, false);
// document.addEventListener("keyup", keyUpHandler, false);
// document.addEventListener("mousemove", mouseMoveHandler, false);

// function keyDownHandler(e: KeyboardEvent) {
//   if (e.key === "Right" || e.key === "ArrowRight") {
//     rightPressed = true;
//   } else if (e.key === "Left" || e.key === "ArrowLeft") {
//     leftPressed = true;
//   }
// }

// function keyUpHandler(e: KeyboardEvent) {
//   if (e.key === "Right" || e.key === "ArrowRight") {
//     rightPressed = false;
//   } else if (e.key === "Left" || e.key === "ArrowLeft") {
//     leftPressed = false;
//   }
// }

// function mouseMoveHandler(e: MouseEvent) {
//   const relativeX = e.clientX - canvas.offsetLeft;
//   if (0 < relativeX && relativeX < canvas.width) {
//     paddleX = relativeX - paddleWidth / 2;
//   }
// }

// function collisionDetection() {
//   for (let c = 0; c < brickColumnCount; c++) {
//     for (let r = 0; r < brickRowCount; r++) {
//       const b = bricks[c][r];
//       if (b.status === 1) {
//         if (
//           b.x < ballPos.x &&
//           ballPos.x < b.x + brickWidth &&
//           b.y < ballPos.y &&
//           ballPos.y < b.y + brickHeight
//         ) {
//           ballVel.y = -ballVel.y;
//           b.status = 0;
//           score++;

//           if (score === brickRowCount * brickColumnCount) {
//             alert("YOU WIN, CONGRATULATIONS!");
//             document.location.reload();
//           }
//         }
//       }
//     }
//   }
// }

// function drawLives() {
//   ctx.font = "16px Arial";
//   ctx.fillStyle = "#0095dd";
//   ctx.fillText(`Lives: ${lives}`, canvas.width - 65, 20);
// }

// function drawScore() {
//   ctx.font = "16px Arial";
//   ctx.fillStyle = "#0095dd";
//   ctx.fillText(`Score: ${score}`, 8, 20);
// }

// function drawPaddle() {
//   ctx.beginPath();
//   ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
//   ctx.fillStyle = "#0095dd";
//   ctx.fill();
//   ctx.closePath();
// }

// function drawBricks() {
//   for (let c = 0; c < brickColumnCount; c++) {
//     for (let r = 0; r < brickRowCount; r++) {
//       if (bricks[c][r].status === 1) {
//         const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
//         const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;

//         bricks[c][r].x = brickX;
//         bricks[c][r].y = brickY;
//         ctx.beginPath();
//         ctx.rect(brickX, brickY, brickWidth, brickHeight);
//         ctx.fillStyle = "#0095dd";
//         ctx.fill();
//         ctx.closePath();
//       }
//     }
//   }
// }

// function draw() {
//   ctx.clearRect(0, 0, canvas.width, canvas.height);
//   drawBall();
//   drawPaddle();
//   drawLives();
//   drawScore();
//   collisionDetection();
//   drawBricks();

//   if (
//     canvas.width - ballRadius < ballPos.x + ballVel.x ||
//     ballPos.x + ballVel.x < ballRadius
//   ) {
//     ballVel.x = -ballVel.x;
//   }
//   if (ballPos.y + ballVel.y < ballRadius) {
//     ballVel.y = -ballVel.y;
//   } else if (canvas.height - ballRadius < ballPos.y + ballVel.y) {
//     if (paddleX < ballPos.x && ballPos.x < paddleX + paddleWidth) {
//       ballVel.y = -ballVel.y;
//     } else {
//       lives--;
//       if (!lives) {
//         alert("GAME OVER!");
//         document.location.reload();
//       } else {
//         ballPos = {
//           x: canvas.width / 2,
//           y: canvas.height - 30,
//         };
//         ballVel = { x: 2, y: -2 };
//         paddleX = (canvas.width - paddleWidth) / 2;
//       }
//     }
//   }

//   if (rightPressed) {
//     paddleX = Math.min(paddleX + 7, canvas.width - paddleWidth);
//   } else if (leftPressed) {
//     paddleX = Math.max(paddleX - 7, 0);
//   }

//   ballPos = {
//     x: ballPos.x + ballVel.x,
//     y: ballPos.y + ballVel.y,
//   };

//   myReq = requestAnimationFrame(draw);
// }

// draw();
