import { SpeedSnek } from "./speedSnek";

let speedSnek = new SpeedSnek();
speedSnek.gameLoop();

// let model: Model;
// let cursor: Cursor;
// let snek: Snek;
// let pellet: Pellet;

// let graphics: Composite;

// const uiHeight = 80;
// const [width, height] = gameSize(uiHeight);

// const uiCanvas = new Canvas("ui", Math.min(width - 200, 400), 80);
// const gameCanvas = new Canvas("game", width, height);

// cursor = new Cursor(gameCanvas.element);
// snek = new Snek({
//   x: gameCanvas.width / 2,
//   y: gameCanvas.height / 2,
// });
// pellet = new Pellet(gameCanvas.element, snek.path);
// model = new Model(cursor, snek, pellet);

// const gameGraphics = new Composite();
// if (process.env.NODE_ENV === "development") {
//   gameGraphics.add(new CursorGraphics(cursor, gameCanvas.context));
// }
// gameGraphics.add(new SnekGraphics(snek, gameCanvas.context));
// gameGraphics.add(new PelletGraphics(pellet, gameCanvas.context));

// const uiGraphics = new Composite();
// uiGraphics.add(new SpeedGraphics(cursor, uiCanvas.context));
// uiGraphics.add(
//   new CurrentScore(
//     model,
//     document.getElementById("currentScore") as HTMLElement
//   )
// );
// uiGraphics.add(
//   new BestScore(model, document.getElementById("bestScore") as HTMLElement)
// );

// graphics = new Composite();
// graphics.add(gameGraphics);
// graphics.add(uiGraphics);

// class SpeedSnek {
//   constructor() {
//     this.gameLoop = this.gameLoop.bind(this);
//   }

//   init() {
//     window.requestAnimationFrame(this.gameLoop);
//     document.addEventListener("pointermove", cursor.moveHandler);
//   }

//   gameLoop() {
//     this.render();
//     this.update();
//     requestAnimationFrame(this.gameLoop);
//   }

//   update() {}

//   render() {
//     gameCanvas.context.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
//     uiCanvas.context.clearRect(0, 0, uiCanvas.width, uiCanvas.height);
//     graphics.render();
//   }
// }

// let speedSnek = new SpeedSnek();
// speedSnek.init();
