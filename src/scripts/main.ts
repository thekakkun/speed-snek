import {
  Canvas,
  Composite,
  CursorGraphics,
  PelletGraphics,
  ScoreGraphics,
  SnekGraphics,
  SpeedGraphics,
} from "./view";
import { Model, Cursor, Snek, Pellet } from "./model";

let speedSnek: Model;
let cursor: Cursor;
let snek: Snek;
let pellet: Pellet;

let graphics: Composite;

const uiCanvas = new Canvas("ui", 512, 80);
const gameCanvas = new Canvas("game", 512, 688);

cursor = new Cursor(gameCanvas.element);
snek = new Snek({
  x: gameCanvas.width / 2,
  y: gameCanvas.height / 2,
});
pellet = new Pellet(gameCanvas.element, snek.path);
speedSnek = new Model(cursor, snek, pellet);
document.addEventListener("pointermove", cursor.moveHandler);

const gameGraphics = new Composite();
if (process.env.NODE_ENV === "development") {
  gameGraphics.add(new CursorGraphics(cursor, gameCanvas.context));
}
gameGraphics.add(new SnekGraphics(snek, gameCanvas.context));
gameGraphics.add(new PelletGraphics(pellet, gameCanvas.context));

const uiGraphics = new Composite();
uiGraphics.add(new SpeedGraphics(cursor, uiCanvas.context));
uiGraphics.add(new ScoreGraphics(speedSnek, uiCanvas.context));

graphics = new Composite();
graphics.add(gameGraphics);
graphics.add(uiGraphics);

function draw() {
  gameCanvas.context.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  uiCanvas.context.clearRect(0, 0, uiCanvas.width, uiCanvas.height);

  graphics.draw();
  requestAnimationFrame(draw);
}
draw();
