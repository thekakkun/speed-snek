import { Arc, dist, intersection } from "./geometry";
import { Pellet, Snek } from "./model";
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

  public snek: Snek;
  public pellet: Pellet;

  // gameplay status
  public score: number;
  public bestScore: number;
  public speedLimit: number;
  public maxSpeed: number;

  constructor() {
    // initialize canvas
    this.gameCanvas = new Canvas("gameBoard", ...gameSize());
    const uiElement = document.getElementById("ui") as HTMLElement;
    uiElement.style.width = `${this.gameCanvas.width}px`;
    this.speedCanvas = new Canvas("speedometer");

    // initialize game objects
    this.snek = new Snek(this.gameCanvas);
    this.pellet = new Pellet(this.gameCanvas.element);

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
    this.speedLimit = Math.min(this.speedLimit + 0.05, this.maxSpeed);
    this.snek.grow();
  }

  public gameLoop() {
    this.update();
    this.render();
    this.reqId = requestAnimationFrame(() => this.gameLoop());
  }

  public update(): void {
    const currentScore = document.getElementById("currentScore") as HTMLElement;
    currentScore.innerHTML = `Score: ${String(this.score).padStart(2, "\xa0")}`;

    const bestScore = document.getElementById("bestScore") as HTMLElement;
    bestScore.innerHTML = `Best: ${String(this.bestScore).padStart(2, "\xa0")}`;
    this.state.update();
  }

  public render(): void {
    this.gameCanvas.clear();
    this.speedCanvas.clear();
    this.state.graphics.render();
    dispatchEvent(new Event("render"));
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
  public update(): void {}
  public abstract exit(): void;
}

// Display game instructions, show the start button
export class Title extends State {
  constructor() {
    super();
  }

  public enter(): void {
    const info = document.getElementById("info") as HTMLElement;
    info.style.display = "flex";
    const startMessage = document.getElementById("startMessage") as HTMLElement;
    startMessage.style.display = "block";
    const endMessage = document.getElementById("endMessage") as HTMLElement;
    endMessage.style.display = "none";

    // Add a click listener to the start button
    // Transition to Ready state when clicked
    const startButton = document.getElementById(
      "startButton"
    ) as HTMLButtonElement;

    startButton.addEventListener(
      "click",
      () => this.game.transitionTo(new Ready()),
      { once: true }
    );
  }

  public exit(): void {
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
    addEventListener("pointermove", this.checkPlayerReady);
    this.game.gameLoop();
  }

  initUiGraphics() {
    const speedCanvas = this.game.speedCanvas;
    const speedContext = speedCanvas.context;

    const speedGraphics = new SpeedGraphics(this.game, speedContext);

    this.graphics.add(speedGraphics);
  }

  initGameGraphics() {
    const gameCanvas = this.game.gameCanvas;
    const gameContext = this.game.gameCanvas.context;

    const snek = this.game.snek;

    const gameGraphics = new Composite();
    const snekLine = new CanvasLine(
      snek.segmentPath,
      gameContext,
      "green",
      snek.snekWidth
    );

    // draw cursor line (if in dev mode) and snek
    if (process.env.NODE_ENV === "development") {
      const cursorLine = new CanvasLine(snek.path, gameContext, "red", 1);
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
    removeEventListener("pointermove", this.checkPlayerReady);
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
    addEventListener("pointermove", snek.moveHandler);
    addEventListener("render", snek.moveHandler);
    addEventListener("touchend", this.touchCheck, {
      once: true,
    });
  }

  update() {
    const countStart = 3;
    const elapsed = (Date.now() - this.startTime) / 1000;

    this.messageElement.innerText = String(countStart - Math.floor(elapsed));

    if (countStart < elapsed) {
      this.game.transitionTo(new Go(this.graphics));
    }
  }

  touchCheck() {
    removeEventListener("pointermove", this.game.snek.moveHandler);
    removeEventListener("render", this.game.snek.moveHandler);
    this.game.transitionTo(new Ready());
  }

  public exit(): void {
    removeEventListener("touchend", this.touchCheck);
  }
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
    pellet.place(snek.segmentPath);

    const gameContext = this.game.gameCanvas.context;
    this.graphics.add(
      new CanvasDisc(
        { center: this.game.pellet.loc!, radius: this.game.pellet.radius },
        gameContext,
        "blue"
      )
    );
  }

  update() {
    this.speedCheck();
    this.snekPelletCollision();
    this.snekWallCollision();
    this.snekSnekCollision();
  }

  speedCheck() {
    if (this.game.snek.speed < this.game.speedLimit) {
      console.log("faster!");
      this.game.transitionTo(new GameOver("You were too slow!"));
    }
  }

  snekPelletCollision() {
    if (this.game.pellet.loc) {
      if (
        2 <= this.game.snek.segmentPath.length &&
        intersection(
          [this.game.snek.segmentPath[0], this.game.snek.segmentPath[1]],
          {
            center: this.game.pellet.loc,
            radius: this.game.pellet.radius + this.game.snek.snekWidth / 2,
          }
        )
      ) {
        console.log("nom!");
        this.game.increaseScore();
        this.game.pellet.place(this.game.snek.segmentPath);
      }
    }
  }

  snekWallCollision() {
    const gameElement = this.game.gameCanvas.element;
    if (
      this.game.snek.segmentPath[0].x - 1 <= 0 ||
      gameElement.clientWidth - 1 <= this.game.snek.segmentPath[0].x ||
      this.game.snek.segmentPath[0].y - 1 <= 0 ||
      gameElement.clientHeight - 1 <= this.game.snek.segmentPath[0].y
    ) {
      console.log("whoops!");
      this.game.transitionTo(new GameOver("You crashed into a wall!"));
    }
  }

  snekSnekCollision() {
    for (let i = 2; i < this.game.snek.segmentPath.length - 1; i++) {
      if (
        intersection(
          [this.game.snek.segmentPath[0], this.game.snek.segmentPath[1]],
          [this.game.snek.segmentPath[i], this.game.snek.segmentPath[i + 1]]
        )
      ) {
        console.log("ouch!");
        this.game.transitionTo(new GameOver("You crashed into yourself!"));
      }
    }
  }

  public exit(): void {
    removeEventListener("pointermove", this.game.snek.moveHandler);
    removeEventListener("render", this.game.snek.moveHandler);
    cancelAnimationFrame(this.game.reqId);
  }
}

// Snek is dead :(
export class GameOver extends State {
  reason: string;

  constructor(reason: string) {
    super();
    this.reason = reason;
  }

  public enter(): void {
    localStorage.setItem("bestScore", String(this.game.bestScore));

    const reasonElement = document.getElementById("reason") as HTMLElement;
    reasonElement.innerText = this.reason;
    const scoreElement = document.getElementById("score") as HTMLElement;
    scoreElement.innerText = `Score: ${this.game.score}`;
    const bestElement = document.getElementById("best") as HTMLElement;
    bestElement.innerText =
      `Best: ${this.game.bestScore}` +
      (this.game.score === this.game.bestScore ? " (NEW BEST!)" : "");

    const info = document.getElementById("info") as HTMLElement;
    info.style.display = "flex";
    const startMessage = document.getElementById("startMessage") as HTMLElement;
    startMessage.style.display = "none";
    const endMessage = document.getElementById("endMessage") as HTMLElement;
    endMessage.style.display = "block";

    const restartButton = document.getElementById(
      "restartButton"
    ) as HTMLButtonElement;

    restartButton.addEventListener(
      "click",
      () => this.game.transitionTo(new Title()),
      { once: true }
    );
  }

  public exit(): void {
    location.reload();
  }
}
