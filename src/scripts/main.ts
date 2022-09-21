import { SpeedSnek, Cursor, Snek, Pellet, Ui } from "./objects";
import { GraphicsComposite } from "./graphics";

const gameCanvas = document.getElementById("game") as HTMLCanvasElement;
const uiCanvas = document.getElementById("ui") as HTMLCanvasElement;

const cursor = new Cursor();
const snek = new Snek({
  x: gameCanvas.width / 2,
  y: gameCanvas.height / 2,
});
const pellet = new Pellet(snek.snekPath, [
  { x: 0, y: 0 },
  { x: gameCanvas.width, y: gameCanvas.height },
]);
const ui = new Ui();
const gameModel = new SpeedSnek(cursor, snek, pellet, ui);

const gameGraphics = new GraphicsComposite(gameCanvas);
gameGraphics.add(cursor);
gameGraphics.add(snek);
gameGraphics.add(pellet);

const uiGraphics = new GraphicsComposite(uiCanvas);
uiGraphics.add(ui);

const graphics = new GraphicsComposite();
graphics.add(gameGraphics);
graphics.add(uiGraphics);

document.addEventListener("pointermove", (e) => {
  e.currentTarget;
  const point = {
    x: e.x - gameCanvas.offsetLeft,
    y: e.y - gameCanvas.offsetTop,
  };
  cursor.add(point, e.timeStamp);
});

let draw = () => {
  graphics.draw();
  graphics.reqId = requestAnimationFrame(draw);
};
draw();
