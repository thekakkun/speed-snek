import { SpeedSnek, Cursor, Snek, Pellet } from "./objects";
import { GraphicsComposite } from "./graphics";

const gameCanvas = document.getElementById("game") as HTMLCanvasElement;
const uiCanvas = document.getElementById("ui") as HTMLCanvasElement;

const cursor = new Cursor();
const snek = new Snek({
  x: gameCanvas.width / 2,
  y: gameCanvas.height / 2,
});
const pellet = new Pellet(
  [
    { x: 0, y: 0 },
    { x: gameCanvas.width, y: gameCanvas.height },
  ],
  snek.snekPath
);
const gameModel = new SpeedSnek(cursor, snek, pellet);

const gameGraphics = new GraphicsComposite(gameCanvas);
gameGraphics.add(cursor);
gameGraphics.add(snek);
gameGraphics.add(pellet);

const uiGraphics = new GraphicsComposite(uiCanvas);

const graphics = new GraphicsComposite();
graphics.add(gameGraphics);
graphics.add(uiGraphics);

document.addEventListener("pointermove", (e) => {
  e.currentTarget;
  const point = {
    x: e.x - gameCanvas.offsetLeft,
    y: e.y - gameCanvas.offsetTop,
  };
  cursor.add(point);
});

let draw = () => {
  graphics.draw();
  graphics.reqId = requestAnimationFrame(draw);
};
draw();
