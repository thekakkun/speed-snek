import {
  Composite,
  CursorGraphics,
  PelletGraphics,
  SnekGraphics,
  UiGraphics,
} from "./graphics";
import { ConcreteMediator, Cursor, Snek, Pellet, SpeedSnek } from "./model";

const gameCanvas = document.getElementById("game") as HTMLCanvasElement;
const gameContext = gameCanvas.getContext("2d") as CanvasRenderingContext2D;
const uiCanvas = document.getElementById("ui") as HTMLCanvasElement;
const uiContext = uiCanvas.getContext("2d") as CanvasRenderingContext2D;

const cursor = new Cursor(gameCanvas);
const snek = new Snek({
  x: gameCanvas.width / 2,
  y: gameCanvas.height / 2,
});
const pellet = new Pellet(gameCanvas, snek.path);
const speedSnek = new SpeedSnek();
const mediator = new ConcreteMediator(speedSnek, cursor, snek, pellet);

const gameGraphics = new Composite();
gameGraphics.add(new CursorGraphics(cursor, gameContext));
gameGraphics.add(new SnekGraphics(snek, gameContext));
gameGraphics.add(new PelletGraphics(pellet, gameContext));

const uiGraphics = new Composite();
uiGraphics.add(new UiGraphics(speedSnek, uiContext));

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
