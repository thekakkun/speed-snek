import { Arc, dist, intersection } from "./geometry";
import {
  Canvas,
  CanvasCircle,
  CanvasDisc,
  CanvasLine,
  Composite,
  SpeedGraphics,
  gameSize,
} from "./graphics";
import { Pellet, Snek } from "./model";
import styles from "../styles/palette.module.scss";

/**
 * The main game object. Responsible for game metadata
 * and for running the logic update and rendering loop,
 * which change depending on the game state.
 */
export class SpeedSnek {
  private state: State;

  public score: number;
  public bestScore: number;
  public speedLimit: number;
  public speedIncrement: number;
  public maxSpeed: number;

  public speedCanvas: Canvas;
  public gameCanvas: Canvas;
  public scale: number;
  public reqId: number;
  public inputType: string;

  /** The Snek object. */
  public snek: Snek;
  public pellet: Pellet;

  /**
   * Constructs a SpeedSnek.
   */
  constructor() {
    this.gameLoop = this.gameLoop.bind(this);

    // initialize canvas
    this.gameCanvas = new Canvas("gameBoard", ...gameSize());
    const uiElement = document.getElementById("ui") as HTMLElement;
    this.showScore();
    uiElement.style.width = `${this.gameCanvas.width}px`;
    this.speedCanvas = new Canvas(
      "speedometer",
      undefined,
      document.getElementById("score")?.clientHeight ?? 60
    );
    this.scale = Math.min(this.gameCanvas.width, this.gameCanvas.height) / 600;
    this.inputType = "";
  }

  /**
   * Runs the exit() method for the current state (if it exists),
   * then transitions to a new state and runs its enter() method.
   * @param state State to transition to.
   */
  public transitionTo(state: State): void {
    if (this.state) {
      this.state.exit();
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`Context: Transition to ${(<any>state).constructor.name}.`);
    }

    this.state = state;
    this.state.setContext(this);
    this.state.enter();
  }

  /** Start a new game */
  public newGame() {
    // initialize game state
    this.score = 0;
    const bestScore = localStorage.getItem("bestScore");
    this.bestScore = bestScore ? Number(bestScore) : 0;
    this.speedLimit = 0;
    this.speedIncrement = 0.05 * this.scale;
    this.maxSpeed = 5 * this.scale;

    // initialize game objects
    this.snek = new Snek(this.gameCanvas, this.scale);
    this.pellet = new Pellet(this.gameCanvas, this.scale);

    // display the title screen
    this.transitionTo(new Title());
  }

  /**
   * Called when a pellet is eaten.
   * Updates the score and speed limit
   */
  public increaseScore() {
    this.score += 1;
    this.bestScore = Math.max(this.bestScore, this.score);
    this.speedLimit = Math.min(
      this.speedLimit + this.speedIncrement,
      this.maxSpeed
    );
    this.snek.grow();
  }

  /** The main game loop. update() checks for logic,
   * render() draws canvas graphics. */
  public gameLoop() {
    this.update();
    this.render();
    this.reqId = requestAnimationFrame(this.gameLoop);
  }

  /** Shows the current and best scores. */
  public showScore(): void {
    const currentScore = document.getElementById("currentScore") as HTMLElement;
    currentScore.innerHTML = `Score: ${String(this.score ?? 0).padStart(
      2,
      "\xa0" // A non-breaking space, since multiple spaces are ignored in HTML
    )}`;

    const bestScore = document.getElementById("bestScore") as HTMLElement;
    bestScore.innerHTML = `Best: ${String(this.bestScore ?? 0).padStart(
      2,
      "\xa0" // A non-breaking space, since multiple spaces are ignored in HTML
    )}`;
  }

  /** Dispatches the update method to state. */
  public update(): void {
    this.state.update();
  }

  /**
   * Clears the canvases, then dispaches render method to state
   * to render a new frame.
   *
   * Also responsible for showing game score and triggering the render event.
   */
  public render(): void {
    this.gameCanvas.clear();
    this.speedCanvas.clear();
    this.showScore();
    this.state.graphics.render();
    dispatchEvent(new Event("render"));
  }
}

/**
 * The abstract State class, declares properties and methods all
 * States should implement.
 */
abstract class State {
  public game: SpeedSnek;
  public graphics: Composite;

  messageElement: HTMLElement;

  /**
   * Constructs a State.
   * @param graphics A composite object wrapping all Canvas render methods.
   */
  constructor(graphics = new Composite()) {
    this.graphics = graphics;
    this.messageElement = document.getElementById("message") as HTMLElement;
  }

  /** Sets a backreference to the SpeedSnek object. */
  public setContext(game: SpeedSnek) {
    this.game = game;
  }

  /** Runs when transitioning to State. */
  public abstract enter(): void;
  /** Logic checking, triggered by the game loop. */
  public update(): void {}
  /** Runs when transitioning from State. */
  public abstract exit(): void;
}

/**
 * State: Displaying game instructions, listening to click on
 * start button.
 * @extends State
 */
class Title extends State {
  /** Construct a Title State. */
  constructor() {
    super();
  }

  /** On entering Title state, show instructions and
   * await start button click. */
  public enter(): void {
    const info = document.getElementById("info") as HTMLElement;
    info.style.display = "flex";
    const startMessage = document.getElementById("startMessage") as HTMLElement;
    startMessage.style.display = "block";
    const endMessage = document.getElementById("endMessage") as HTMLElement;
    endMessage.style.display = "none";

    const startButton = document.getElementById(
      "startButton"
    ) as HTMLButtonElement;

    startButton.addEventListener("pointerdown", (e) => {
      this.game.inputType = e.pointerType;

      startButton.addEventListener(
        "pointerup",
        () => {
          this.game.transitionTo(new Ready());
        },
        { once: true }
      );
    });
  }

  /** Hide instruction elements on transition away from Title. */
  public exit(): void {
    const info = document.getElementById("info") as HTMLElement;
    info.style.display = "none";
  }
}

/**
 * State: UI and snek are rendered, ready for user input.
 * @extends State
 */
class Ready extends State {
  /** Transition to next state if user pointer within this area */
  readyArea!: Arc;
  readyAreaGraphics!: CanvasCircle;

  /** Constructs a Ready State. */
  constructor() {
    super();
    this.checkPlayerReady = this.checkPlayerReady.bind(this);
  }

  /**
   * On transitioning to state, initialize game graphics,
   * and await user input.
   */
  public enter(): void {
    const pointerType = this.game.inputType === "touch" ? "finger" : "cursor";
    this.messageElement.innerText = `${pointerType} on the circle to start`;
    this.initSpeedGraphics();
    this.initGameGraphics();

    const gameElement = this.game.gameCanvas.element;
    gameElement.addEventListener("pointerdown", (e) => {
      gameElement.releasePointerCapture(e.pointerId);
    });
    gameElement.addEventListener("pointermove", this.checkPlayerReady);
    this.game.reqId = requestAnimationFrame(this.game.gameLoop);
  }

  /** Initialize the speedometer graphics Composite. */
  initSpeedGraphics() {
    const speedGraphics = new SpeedGraphics(this.game, this.game.speedCanvas);
    this.graphics.add(speedGraphics);
  }

  /** Initialize the game graphics Composite. */
  initGameGraphics() {
    const snek = this.game.snek;
    const gameGraphics = new Composite();

    if (process.env.NODE_ENV === "development") {
      /** Raw input from cursor, only shown during dev */
      const cursorLine = new CanvasLine(
        snek.path,
        this.game.gameCanvas,
        styles.red,
        1
      );
      gameGraphics.add(cursorLine);
    }
    const snekLine = new CanvasLine(
      snek.segmentPath,
      this.game.gameCanvas,
      styles.green,
      snek.snekWidth
    );
    gameGraphics.add(snekLine);
    this.graphics.add(gameGraphics);

    this.readyArea = {
      center: {
        x: this.game.gameCanvas.width / 2,
        y: this.game.gameCanvas.height / 2,
      },
      radius: 30,
    };
    this.readyAreaGraphics = new CanvasCircle(
      this.readyArea,
      this.game.gameCanvas,
      styles.red,
      5
    );
    this.graphics.add(this.readyAreaGraphics);
  }

  /**
   * Transition to Set state once pointer is within readyArea.
   * @param e The PointerEvent from the listener.
   */
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

  /** Remove readyArea on transition from Ready State. */
  public exit(): void {
    this.game.gameCanvas.element.removeEventListener(
      "pointermove",
      this.checkPlayerReady
    );
    this.graphics.remove(this.readyAreaGraphics);
  }
}

/**
 * State: Speedometer and snek are responding to user input, showing countdown.
 * @extends State
 */
class Set extends State {
  startTime: number;

  /** Constructs a Set State. */
  constructor(graphics: Composite) {
    super(graphics);
    this.startTime = Date.now();
    this.notReady = this.notReady.bind(this);
  }

  /**
   * Add eventListeners for game interaction.
   * Check that user hasn't stopped interacting with game canvas.
   */
  public enter(): void {
    const gameElement = this.game.gameCanvas.element;
    gameElement.addEventListener("pointermove", this.game.snek.moveHandler);
    addEventListener("render", this.game.snek.renderHandler);
    gameElement.addEventListener("pointerleave", this.notReady, {
      once: true,
    });
  }

  /** Start the countdown to transition to next State. */
  update() {
    const countStart = 3;
    const elapsed = (Date.now() - this.startTime) / 1000;

    this.messageElement.innerText = String(countStart - Math.floor(elapsed));

    if (countStart < elapsed) {
      this.game.transitionTo(new Go(this.graphics));
    }
  }

  /** Go back to Ready state. */
  notReady() {
    removeEventListener("render", this.game.snek.renderHandler);
    this.game.transitionTo(new Ready());
  }

  /** On transition from state, remove triggering notReady(). */
  public exit(): void {
    this.game.gameCanvas.element.removeEventListener(
      "pointerleave",
      this.notReady
    );
  }
}

/**
 * State: The player is now playing the game
 * @extends State
 */
class Go extends State {
  /** Constructs a Go State. */
  constructor(graphics: Composite) {
    super(graphics);
    this.snekLeave = this.snekLeave.bind(this);
  }

  /** On transition to Go state, place the pellet in the canvas. */
  public enter(): void {
    this.game.gameCanvas.element.addEventListener(
      "pointerleave",
      this.snekLeave
    );

    this.messageElement.innerHTML = "GO!";
    setTimeout(() => {
      this.messageElement.innerText = "";
    }, 1000);

    const pellet = this.game.pellet;
    const snek = this.game.snek;
    pellet.place(snek.segmentPath);

    this.graphics.add(
      new CanvasDisc(
        { center: this.game.pellet.loc!, radius: this.game.pellet.radius },
        this.game.gameCanvas,
        styles.blue
      )
    );
  }

  /** Check for scoring and game over. */
  update() {
    this.speedCheck();
    this.snekPelletCollision();
    this.snekSnekCollision();
    if (process.env.NODE_ENV === "development") {
      // this.messageElement.innerText = `x: ${this.game.snek.path[0].x} y: ${this.game.snek.path[0].y}`;
    }
  }

  /** Transition to GameOver if under speed limit. */
  speedCheck() {
    if (this.game.snek.speed < this.game.speedLimit) {
      console.log("faster!");
      this.game.transitionTo(new GameOver("You were too slow!"));
    }
  }

  /** Check for snek eating pellet. */
  snekPelletCollision() {
    if (this.game.pellet.loc) {
      if (
        2 <= this.game.snek.path.length &&
        intersection([this.game.snek.path[0], this.game.snek.path[1]], {
          center: this.game.pellet.loc,
          radius: this.game.pellet.radius + this.game.snek.snekWidth / 2,
        })
      ) {
        console.log("nom!");
        this.game.increaseScore();
        this.game.pellet.place(this.game.snek.segmentPath);
      }
    }
  }

  /** Trigger if snek has left the game canvas. */
  snekLeave() {
    console.log("whoops!");
    this.game.transitionTo(new GameOver("You crashed into a wall!"));
  }

  /** Check for snek colliding with itself. */
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

  /** Remove gameplay event listeners on transition to next State. */
  public exit(): void {
    const gameElement = this.game.gameCanvas.element;
    gameElement.removeEventListener("pointerleave", this.snekLeave);
    gameElement.removeEventListener("pointermove", this.game.snek.moveHandler);
    removeEventListener("render", this.game.snek.renderHandler);
  }
}

/**
 * State: Snek is dead ;(.
 * @extends State
 */
class GameOver extends State {
  reason: string;

  /**
   * Constructs a GameOver State.
   * @param reason Reason for game over.
   */
  constructor(reason: string) {
    super();
    this.reason = reason;
  }

  /**
   * On transitioning to GameOver, display the info elements,
   * with information on the last game, and a button to play again.
   */
  public enter(): void {
    localStorage.setItem("bestScore", String(this.game.bestScore));

    const reasonElement = document.getElementById("reason") as HTMLElement;
    reasonElement.innerText = this.reason;

    const scoreElement = document.getElementById("finalScore") as HTMLElement;
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
      () => {
        this.game.newGame();
      },
      { once: true }
    );
  }

  public exit(): void {
    cancelAnimationFrame(this.game.reqId);
  }
}
