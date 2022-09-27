import { Arc, dist } from "./geometry";
import { Cursor, Model, Pellet, Snek } from "./model";
import {
  BestScore,
  Canvas,
  CanvasCircle,
  CanvasLine,
  Composite,
  CurrentScore,
  CursorGraphics,
  gameSize,
  PelletGraphics,
  SnekGraphics,
  SpeedGraphics,
  Text,
} from "./view";

export class SpeedSnek {
  private state: State;

  public speedCanvas: Canvas;
  public gameCanvas: Canvas;

  public model: Model;
  public cursor: Cursor;
  public snek: Snek;
  public pellet: Pellet;

  reqId: number;

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
    this.render();
    this.reqId = requestAnimationFrame(() => this.gameLoop());
  }

  public render(): void {
    this.gameCanvas.clear();
    this.speedCanvas.clear();
    this.state.render();
  }
}

abstract class State {
  public context: SpeedSnek;
  public graphics: Composite;

  constructor(graphics = new Composite()) {
    this.graphics = graphics;
  }

  public setContext(context: SpeedSnek) {
    this.context = context;
  }

  public abstract enter(): void;
  public abstract exit(): void;

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
      this.context.transitionTo(new Ready())
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
  messageGraphics!: Text;

  constructor() {
    super();
    this.checkPlayerReady = this.checkPlayerReady.bind(this);
    this.messageGraphics = new Text(
      "Pointer in the circle to start",
      document.getElementById("message") as HTMLElement
    );
  }

  public enter(): void {
    this.initUiGraphics();
    this.initGameGraphics();
    document.addEventListener("pointermove", this.checkPlayerReady);
  }

  initUiGraphics() {
    const uiContext = this.context.speedCanvas.context;
    const model = this.context.model;
    const cursor = this.context.cursor;
    const uiGraphics = new Composite();
    const speedGraphics = new SpeedGraphics(cursor, uiContext);
    const currentScore = new CurrentScore(
      model,
      document.getElementById("currentScore") as HTMLElement
    );
    const bestScore = new BestScore(
      model,
      document.getElementById("bestScore") as HTMLElement
    );

    uiGraphics.add(speedGraphics);
    uiGraphics.add(currentScore);
    uiGraphics.add(bestScore);

    this.graphics.add(uiGraphics);
    this.graphics.add(this.messageGraphics);
  }

  initGameGraphics() {
    const gameCanvas = this.context.gameCanvas;
    const gameContext = this.context.gameCanvas.context;

    const cursor = this.context.cursor;
    const snek = this.context.snek;

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
    const gameCanvas = this.context.gameCanvas;
    const gameWrapper = gameCanvas.element.parentElement as HTMLElement;

    const cursor = {
      x: e.x - gameWrapper.offsetLeft - gameWrapper.clientLeft,
      y: e.y - gameWrapper.offsetTop - gameWrapper.clientTop,
    };

    if (dist(cursor, this.readyArea.center) < this.readyArea.radius) {
      this.context.transitionTo(new Set(this.graphics));
    }
  }

  public exit(): void {
    document.removeEventListener("pointermove", this.checkPlayerReady);
    this.graphics.remove(this.messageGraphics);
    this.graphics.remove(this.readyAreaGraphics);
  }
}

// UI and snek are live, showing countdown
export class Set extends State {
  messageGraphics: Text;

  constructor(graphics: Composite) {
    super(graphics);
    this.messageGraphics = new Text(
      "",
      document.getElementById("message") as HTMLElement
    );
  }

  public enter(): void {
    const cursor = this.context.cursor;
    document.addEventListener("pointermove", cursor.moveHandler);

    while (true) {}
  }
  public exit(): void {}
}

// game is live
export class Go extends State {
  constructor(graphics: Composite) {
    super(graphics);
  }

  public enter(): void {
    const pellet = this.context.pellet;
    const snek = this.context.snek;
    pellet.place(snek.path);

    const gameContext = this.context.gameCanvas.context;
    this.graphics.add(new PelletGraphics(this.context.pellet, gameContext));
  }

  public exit(): void {}
}

// Snek is dead :(
export class GameOver extends State {
  constructor() {
    super();
  }

  public enter(): void {}

  public exit(): void {}
}
