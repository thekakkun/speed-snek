import { Arc, dist } from "./geometry";
import { Cursor, Model, Pellet, Snek } from "./model";
import {
  Canvas,
  CanvasCircle,
  Composite,
  CursorGraphics,
  gameSize,
  PelletGraphics,
  SnekGraphics,
  SpeedGraphics,
} from "./graphics";

export class SpeedSnek {
  // store current state
  private state: State;

  // game canvases
  public speedCanvas: Canvas;
  public gameCanvas: Canvas;
  reqId: number;

  // game model
  public model: Model;
  public cursor: Cursor;
  public snek: Snek;
  public pellet: Pellet;

  // gameplay status
  public score: number;
  public bestScore: number;
  public speedLimit: number;

  constructor() {
    // initialize canvas
    const uiHeight = 80;
    const [width, height] = gameSize(uiHeight);
    this.speedCanvas = new Canvas("ui", Math.min(width - 200, 400), 80);
    this.gameCanvas = new Canvas("game", width, height);

    // initialize game objects
    this.cursor = new Cursor(this.gameCanvas.element);
    this.snek = new Snek({
      x: this.gameCanvas.width / 2,
      y: this.gameCanvas.height / 2,
    });
    this.pellet = new Pellet(this.gameCanvas.element);
    this.model = new Model(this.cursor, this.snek, this.pellet);

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
  cursor: Cursor;

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
    const cursor = this.game.cursor;

    const uiGraphics = new Composite();
    const speedGraphics = new SpeedGraphics(cursor, uiContext);

    uiGraphics.add(speedGraphics);
    this.graphics.add(uiGraphics);

    const currentScore = document.getElementById("currentScore") as HTMLElement;
    currentScore.innerHTML = `Score: ${"0".padStart(2, "\xa0")}`;

    const bestScore = document.getElementById("bestScore") as HTMLElement;
    const bestScoreValue = localStorage.getItem("bestScore") || "0";
    bestScore.innerHTML = `Score: ${bestScoreValue.padStart(2, "\xa0")}`;
  }

  initGameGraphics() {
    const gameCanvas = this.game.gameCanvas;
    const gameContext = this.game.gameCanvas.context;

    const cursor = this.game.cursor;
    const snek = this.game.snek;

    const gameGraphics = new Composite();
    const snekLine = new SnekGraphics(snek, gameContext);
    const cursorLine = new CursorGraphics(cursor, gameContext);
    // const snekLine = new CanvasLine(snek.path, gameContext, "green", 8);
    // const cursorLine = new CanvasLine(cursor.path, gameContext, "red", 1);

    // draw cursor line (if in dev mode) and snek
    if (process.env.NODE_ENV === "development") {
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
    const cursor = this.game.cursor;
    document.addEventListener("pointermove", cursor.moveHandler);
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
    this.graphics.add(new PelletGraphics(this.game.pellet, gameContext));
  }

  update() {}

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
