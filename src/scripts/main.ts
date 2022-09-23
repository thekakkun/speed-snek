import {
  Composite,
  CursorGraphics,
  PelletGraphics,
  ScoreGraphics,
  SnekGraphics,
  SpeedGraphics,
} from "./graphics";
import { SpeedSnek, Cursor, Snek, Pellet } from "./model";

const width = 512;
const gameHeight = 688;
const uiHeight = 80;

const gameCanvas = document.getElementById("game") as HTMLCanvasElement;
const uiCanvas = document.getElementById("ui") as HTMLCanvasElement;
const gameContext = gameCanvas.getContext("2d") as CanvasRenderingContext2D;
const uiContext = uiCanvas.getContext("2d") as CanvasRenderingContext2D;

gameCanvas.style.width = `${width}px`;
gameCanvas.style.height = `${gameHeight}px`;
uiCanvas.style.width = `${width}px`;
uiCanvas.style.height = `${uiHeight}px`;

const scale = window.devicePixelRatio;
gameCanvas.width = Math.floor(width * scale);
gameCanvas.height = Math.floor(gameHeight * scale);
uiCanvas.width = Math.floor(width * scale);
uiCanvas.height = Math.floor(uiHeight * scale);

gameContext.scale(scale, scale);
uiContext.scale(scale, scale);

const cursor = new Cursor(gameCanvas);
const snek = new Snek({
  x: gameCanvas.clientWidth / 2,
  y: gameCanvas.clientHeight / 2,
});
const pellet = new Pellet(gameCanvas, snek.path);
const speedSnek = new SpeedSnek(cursor, snek, pellet);

const gameGraphics = new Composite();
if (process.env.NODE_ENV === "development") {
  gameGraphics.add(new CursorGraphics(cursor, gameContext));
}
gameGraphics.add(new SnekGraphics(snek, gameContext));
gameGraphics.add(new PelletGraphics(pellet, gameContext));

const uiGraphics = new Composite();
uiGraphics.add(new SpeedGraphics(cursor, uiContext));
uiGraphics.add(new ScoreGraphics(speedSnek, uiContext));

const graphics = new Composite();
graphics.add(gameGraphics);
graphics.add(uiGraphics);

document.addEventListener("pointermove", cursor.moveHandler);

function draw() {
  gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  uiContext.clearRect(0, 0, uiCanvas.width, uiCanvas.height);

  graphics.draw();
  requestAnimationFrame(draw);
}
draw();
