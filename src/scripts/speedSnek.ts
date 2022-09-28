import { Arc, dist, intersection } from "./geometry";
import { Model, Pellet, Snek } from "./model";
import {
  Canvas,
  CanvasCircle,
  CanvasDisc,
  CanvasLine,
  Composite,
  gameSize,
  SpeedGraphics,
} from "./graphics";

export class SpeedSnek {
  // store current state
  private state: State;

  // game canvases
  public speedCanvas: Canvas;
  public gameCanvas: Canvas;
  public reqId: number;

  // game model
  public model: Model;
  // public cursor: Cursor;
  public snek: Snek;
  public pellet: Pellet;

  // gameplay status
  public score: number;
  public bestScore: number;
  public speedLimit: number;
  public maxSpeed: number;

  constructor() {
    // initialize canvas
    this.gameCanvas = new Canvas("game", ...gameSize());
    const uiElement = document.getElementById("ui") as HTMLElement
    uiElement.style.width = `${this.gameCanvas.width}px`;
    this.speedCanvas = new Canvas("speedometer");

    // initialize game objects
    // this.cursor = new Cursor(this.gameCanvas.element);
    this.snek = new Snek(this.gameCanvas);
    this.pellet = new Pellet(this.gameCanvas.element);
    this.model = new Model(this.snek, this.pellet);

    // initialize game state
    this.score = 0;
    const bestScore = localStorage.getItem("bestScore");
    this.bestScore = bestScore ? Number(bestScore) : 0;
    this.speedLimit = 0;
    this.maxSpeed = 5;

    // Start on title screen
    this.transitionTo(new Title());
  }

  public transitionTo(state: State): void {
    console.log(`Context: Transition to ${(<any>state).constructor.name}.`);
    if (this.state) {
      this.state.exit();
    }

    this.state = state;
    this.state.setContext(this);

    this.state.enter();
  }

  public increaseScore() {
    this.score += 1;
    this.bestScore = Math.max(this.bestScore, this.score);
    this.speedLimit += Math.min(this.speedLimit + 0.05, this.maxSpeed);
  }

  public gameLoop() {
    this.update();
    this.render();
    this.reqId = requestAnimationFrame(() => this.gameLoop());
  }

  public update(): void {
    this.state.update();
  }

  public render(): void {
    this.gameCanvas.clear();
    this.speedCanvas.clear();
    this.state.render();
    this.drawScore();
  }

  public drawScore(): void {
    const currentScore = document.getElementById("currentScore") as HTMLElement;
    currentScore.innerHTML = `Score: ${String(this.score).padStart(2, "\xa0")}`;

    const bestScore = document.getElementById("bestScore") as HTMLElement;

    bestScore.innerHTML = `Best: ${String(this.bestScore).padStart(2, "\xa0")}`;
  }
}

abstract class State {
  public game: SpeedSnek;
  public graphics: Composite;

  messageElement: HTMLElement;

  constructor(graphics = new Composite()) {
    this.graphics = graphics;
    this.messageElement = document.getElementById("message") as HTMLElement;
  }

  public setContext(game: SpeedSnek) {
    this.game = game;
  }

  public abstract enter(): void;
  public abstract exit(): void;

  public update(): void {}
  public render(): void {
    return this.graphics.render();
  }
}

// Display game instructions, show start button
export class Title extends State {
  startButton: HTMLButtonElement;

  constructor() {
    super();
  }

  public enter(): void {
    // Add a click listener to the start button
    // Transition to Ready state when clicked
    this.startButton = document.getElementById(
      "startButton"
    ) as HTMLButtonElement;

    this.startButton.addEventListener("click", () =>
      this.game.transitionTo(new Ready())
    );
  }

  public exit(): void {
    // Hide the info elements, and remove event listener
    this.startButton.removeEventListener("click", this.exit);

    const info = document.getElementById("info") as HTMLElement;
    info.style.display = "none";
  }
}

// UI and snek are live, ready for user input
export class Ready extends State {
  readyArea!: Arc;
  readyAreaGraphics!: CanvasCircle;

  constructor() {
    super();
    this.checkPlayerReady = this.checkPlayerReady.bind(this);
  }

  public enter(): void {
    this.messageElement.innerText = "Pointer in the circle to start";
    this.initUiGraphics();
    this.initGameGraphics();
    document.addEventListener("pointermove", this.checkPlayerReady);
  }

  initUiGraphics() {
    const uiContext = this.game.speedCanvas.context;
    const snek = this.game.snek;

    const uiGraphics = new Composite();
    const speedGraphics = new SpeedGraphics(snek, uiContext);

    uiGraphics.add(speedGraphics);
    this.graphics.add(uiGraphics);
  }

  initGameGraphics() {
    const gameCanvas = this.game.gameCanvas;
    const gameContext = this.game.gameCanvas.context;

    const snek = this.game.snek;

    const gameGraphics = new Composite();
    const snekLine = new CanvasLine(
      snek.path,
      gameContext,
      "green",
      snek.snekWidth
    );

    // draw cursor line (if in dev mode) and snek
    if (process.env.NODE_ENV === "development") {
      const cursorLine = new CanvasLine(snek.rawPath, gameContext, "red", 1);
      gameGraphics.add(cursorLine);
    }
    gameGraphics.add(snekLine);
    this.graphics.add(gameGraphics);

    // draw circle for starting area
    this.readyArea = {
      center: { x: gameCanvas.width / 2, y: gameCanvas.height / 2 },
      radius: 30,
    };
    this.readyAreaGraphics = new CanvasCircle(
      this.readyArea,
      gameContext,
      "blue",
      5
    );
    this.graphics.add(this.readyAreaGraphics);
  }

  checkPlayerReady(e: PointerEvent) {
    const gameCanvas = this.game.gameCanvas;
    const gameWrapper = gameCanvas.element.parentElement as HTMLElement;

    const cursor = {
      x: e.x - gameWrapper.offsetLeft - gameWrapper.clientLeft,
      y: e.y - gameWrapper.offsetTop - gameWrapper.clientTop,
    };

    if (dist(cursor, this.readyArea.center) < this.readyArea.radius) {
      this.game.transitionTo(new Set(this.graphics));
    }
  }

  public exit(): void {
    document.removeEventListener("pointermove", this.checkPlayerReady);
    this.graphics.remove(this.readyAreaGraphics);
  }
}

// UI and snek are live, showing countdown
export class Set extends State {
  startTime: number;

  constructor(graphics: Composite) {
    super(graphics);

    this.startTime = Date.now();
  }

  public enter(): void {
    const snek = this.game.snek;
    document.addEventListener("pointermove", snek.moveHandler);
  }

  update() {
    const countStart = 3;
    const elapsed = (Date.now() - this.startTime) / 1000;

    this.messageElement.innerText = String(countStart - Math.floor(elapsed));

    if (countStart < elapsed) {
      this.game.transitionTo(new Go(this.graphics));
    }
  }

  public exit(): void {}
}

// game is live
export class Go extends State {
  constructor(graphics: Composite) {
    super(graphics);
  }

  public enter(): void {
    this.messageElement.innerHTML = "GO!";
    setTimeout(() => {
      this.messageElement.innerText = "";
    }, 1000);

    const pellet = this.game.pellet;
    const snek = this.game.snek;
    pellet.place(snek.path);

    const gameContext = this.game.gameCanvas.context;
    this.graphics.add(
      new CanvasDisc(
        { center: this.game.pellet.loc!, radius: this.game.pellet.r },
        gameContext,
        "blue"
      )
    );
  }

  update() {
    const snek = this.game.snek;
    const snekPath = snek.path;
    const cursorPath = snek.rawPath;
    const pellet = this.game.pellet;

    // speed check
    if (snek.speed < this.game.speedLimit) {
      console.log("faster!");
    }

    // snek vs. pellet collision
    if (pellet.loc) {
      if (
        2 <= cursorPath.length &&
        intersection([cursorPath[0], cursorPath[1]], {
          center: pellet.loc,
          radius: pellet.r + snek.snekWidth / 2,
        })
      ) {
        console.log("nom!");
        this.game.increaseScore();
        this.game.model.notify(["eatpellet", this]);
      }
    }

    // snek vs. wall collision
    const gameElement = this.game.gameCanvas.element;
    if (
      snekPath[0].x - 1 <= 0 ||
      gameElement.clientWidth - 1 <= snekPath[0].x ||
      snekPath[0].y - 1 <= 0 ||
      gameElement.clientHeight - 1 <= snekPath[0].y
    ) {
      console.log("whoops!");
    }

    // snek vs. snek collision
    for (let i = 2; i < snekPath.length - 1; i++) {
      if (
        intersection([snekPath[0], snekPath[1]], [snekPath[i], snekPath[i + 1]])
      ) {
        console.log("ouch!");
        break;
      }
    }
  }

  public exit(): void {}
}

// Snek is dead :(
export class GameOver extends State {
  reason: string;

  constructor(reason: string) {
    super();

    this.reason = reason;
  }

  public enter(): void {}

  public exit(): void {}
}
