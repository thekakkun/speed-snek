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
import { storageAvailable } from "./helper";

/**
 * The main game object. Responsible for game metadata
 * and for running the logic update and rendering loop,
 * which change depending on the game state.
 */
export class SpeedSnek {
  private state!: State;

  public reqId: number;
  public updateTime: DOMHighResTimeStamp;
  public pointerEventsSinceUpdate: number;

  public browserEnv: BrowserEnv;
  public stats: GameStats;

  /** The Snek object. */
  public snek!: Snek;
  public pellet!: Pellet;

  /**
   * Constructs a SpeedSnek.
   */
  constructor(state: State) {
    this.reqId = 0;
    this.updateTime = performance.now();
    this.pointerEventsSinceUpdate = 0;

    this.browserEnv = new BrowserEnv();
    this.stats = new GameStats(
      this.browserEnv.scale,
      this.browserEnv.storageAvailable
    );
    this.stats.showScore();

    this.gameLoop = this.gameLoop.bind(this);
    this.moveHandler = this.moveHandler.bind(this);

    this.transitionTo(state);
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
    this.stats = new GameStats(this.browserEnv.scale);

    // initialize game objects
    this.snek = new Snek(this.browserEnv.gameCanvas, this.browserEnv.scale);
    this.pellet = new Pellet(this.browserEnv.gameCanvas, this.browserEnv.scale);
  }

  /**
   * Called when a pellet is eaten.
   * Updates the score and speed limit
   */
  public increaseScore() {
    this.stats.increaseScore();
    this.snek.grow();
  }

  /** The main game loop. update() checks for logic,
   * render() draws canvas graphics. */
  public gameLoop(timeStamp: DOMHighResTimeStamp) {
    this.update(timeStamp);
    this.render();
    this.reqId = requestAnimationFrame(this.gameLoop);
  }

  /**
   * Clears the canvases, then dispaches render method to state
   * to render a new frame.
   *
   * Also responsible for showing game score and triggering the render event.
   */
  public render(): void {
    this.browserEnv.gameCanvas.clear();
    this.browserEnv.speedCanvas.clear();
    this.stats.showScore();
    this.state.graphics.render();
  }

  /** Dispatches the update method to state. */
  public update(timeStamp: DOMHighResTimeStamp): void {
    this.calcSpeed(timeStamp);
    this.state.update();
    this.updateTime = timeStamp;
    this.pointerEventsSinceUpdate = 0;
  }

  /** Calculate a smoothed speed, based on the raw value.
   * Smoothing is done via exponential smoothing.
   */
  public calcSpeed(timeStamp: DOMHighResTimeStamp): void {
    /**
     * The time constant.
     * The time it takes a unit step function to reach
     * 63.2^ of the original signal.
     * */
    const tau = 0.6;
    const tDelta = (timeStamp - this.updateTime) / 1000;
    const alpha = 1 - Math.exp(-tDelta / tau);

    let speed;
    if (this.pointerEventsSinceUpdate === 0) {
      speed = 0;
    } else {
      speed = this.snek.speed;
    }

    this.stats.speed = alpha * speed + (1 - alpha) * this.stats.speed;
  }

  /** Increment on pointermove event */
  public moveHandler() {
    this.pointerEventsSinceUpdate++;
  }
}

/**
 * Stores info about the browser and environment the game is running in.
 */
class BrowserEnv {
  public speedCanvas: Canvas;
  public gameCanvas: Canvas;
  public scale: number;
  public inputType: string;
  public storageAvailable: boolean;

  /** Construct  a BrowserEnv. */
  constructor() {
    this.storageAvailable = storageAvailable("sessionStorage");
    if (!this.storageAvailable) {
      this.hideBest();
    }

    this.gameCanvas = new Canvas("gameBoard", ...gameSize());
    const uiElement = document.getElementById("ui") as HTMLElement;

    uiElement.style.width = `${this.gameCanvas.width}px`;
    this.speedCanvas = new Canvas(
      "speedometer",
      undefined,
      document.getElementById("score")?.clientHeight ?? 60
    );

    this.scale = Math.min(this.gameCanvas.width, this.gameCanvas.height) / 600;
    this.inputType = "";
  }

  hideBest() {
    const bestScore = document.getElementById("bestScore") as HTMLElement;
    bestScore.style.display = "none";

    const finalBest = document.getElementById("finalBest") as HTMLElement;
    finalBest.style.display = "none";

    const gitLink = "https://thekakkun.github.io/speed-snek/";
    console.log(
      `Web Storage unavailable, so we won't be saving your high scores.\n${
        window.location.origin + window.location.pathname !== gitLink
          ? `You may fare better here:\n${gitLink}`
          : ""
      }`
    );
  }
}

/**
 * Stores info about the state of the game.
 */
export class GameStats {
  public score: number;
  public bestScore: number;
  public speed: number;
  public speedLimit: number;
  public maxSpeed: number;
  public speedIncrement: number;

  /** Construct a GameStats */
  constructor(scale = 1, storageAvailable = false) {
    this.score = 0;
    if (storageAvailable) {
      this.bestScore = Number(localStorage.getItem("bestScore") ?? 0);
    } else {
      this.bestScore = 0;
    }

    this.speedLimit = 0;
    this.speed = 0;
    this.maxSpeed = 3.6 * scale;
    this.speedIncrement = 0.01;
  }

  /** Increase the game score and difficulty. */
  public increaseScore() {
    this.score += 1;
    this.bestScore = Math.max(this.bestScore, this.score);
    this.speedLimit = Math.min(
      this.speedLimit + this.maxSpeed * this.speedIncrement,
      this.maxSpeed
    );
  }

  public showScore(): void {
    const currentScore = document.getElementById("currentScore") as HTMLElement;
    currentScore.innerHTML = `Score: ${String(this.score).padStart(
      2,
      "\xa0" // A non-breaking space, since multiple spaces are ignored in HTML
    )}`;
    const bestElement = document.getElementById("bestScore") as HTMLElement;
    bestElement.innerHTML = `Best: ${String(this.bestScore ?? 0).padStart(
      2,
      "\xa0" // A non-breaking space, since multiple spaces are ignored in HTML
    )}`;
  }
}

/**
 * The abstract State class, declares properties and methods all
 * States should implement.
 */
abstract class State {
  public game!: SpeedSnek;
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
export class Title extends State {
  /** Construct a Title State. */
  constructor() {
    super();
    this.startClickListener = this.startClickListener.bind(this);
  }

  /** On entering Title state, show instructions and
   * await start button click. */
  public enter(): void {
    this.game.newGame();

    const info = document.getElementById("info") as HTMLElement;
    info.style.display = "flex";
    const startMessage = document.getElementById("startMessage") as HTMLElement;
    startMessage.style.display = "block";
    const endMessage = document.getElementById("endMessage") as HTMLElement;
    endMessage.style.display = "none";

    const startButton = document.getElementById(
      "startButton"
    ) as HTMLButtonElement;

    startButton.addEventListener("pointerdown", this.startClickListener);
  }

  startClickListener(e: PointerEvent) {
    this.game.browserEnv.inputType = e.pointerType;
    const startButton = document.getElementById(
      "startButton"
    ) as HTMLButtonElement;

    startButton.addEventListener(
      "pointerup",
      () => {
        this.game.transitionTo(new Ready());
      },
      { once: true }
    );
  }

  /** Hide instruction elements on transition away from Title. */
  public exit(): void {
    const info = document.getElementById("info") as HTMLElement;
    info.style.display = "none";
    const startButton = document.getElementById(
      "startButton"
    ) as HTMLButtonElement;

    startButton.removeEventListener("pointerdown", this.startClickListener);
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
    const pointerType =
      this.game.browserEnv.inputType === "touch" ? "finger" : "cursor";
    this.messageElement.innerText = `${pointerType} on the circle to start`;
    this.initSpeedGraphics();
    this.initGameGraphics();

    const gameElement = this.game.browserEnv.gameCanvas.element;
    gameElement.addEventListener("pointerdown", (e) => {
      gameElement.releasePointerCapture(e.pointerId);
    });
    gameElement.addEventListener("pointermove", this.checkPlayerReady);
    this.game.reqId = requestAnimationFrame(this.game.gameLoop);
  }

  /** Initialize the speedometer graphics Composite. */
  initSpeedGraphics() {
    const speedGraphics = new SpeedGraphics(
      this.game.stats,
      this.game.browserEnv.speedCanvas
    );
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
        this.game.browserEnv.gameCanvas,
        styles.red,
        1
      );
      gameGraphics.add(cursorLine);
    }
    const snekLine = new CanvasLine(
      snek.segmentPath,
      this.game.browserEnv.gameCanvas,
      styles.green,
      snek.snekWidth
    );
    gameGraphics.add(snekLine);
    this.graphics.add(gameGraphics);

    this.readyArea = {
      center: {
        x: this.game.browserEnv.gameCanvas.width / 2,
        y: this.game.browserEnv.gameCanvas.height / 2,
      },
      radius: 30,
    };
    this.readyAreaGraphics = new CanvasCircle(
      this.readyArea,
      this.game.browserEnv.gameCanvas,
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
    const gameCanvas = this.game.browserEnv.gameCanvas;
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
    this.game.browserEnv.gameCanvas.element.removeEventListener(
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
    const gameElement = this.game.browserEnv.gameCanvas.element;
    gameElement.addEventListener("pointermove", this.game.moveHandler);
    gameElement.addEventListener("pointermove", this.game.snek.moveHandler);
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
    this.game.transitionTo(new Ready());
  }

  /** On transition from state, remove triggering notReady(). */
  public exit(): void {
    this.game.browserEnv.gameCanvas.element.removeEventListener(
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
    this.game.browserEnv.gameCanvas.element.addEventListener(
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
        this.game.browserEnv.gameCanvas,
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
      // this.messageElement.innerText = `${this.game.speed.toPrecision(3)}`;
    }
  }

  /** Transition to GameOver if under speed limit. */
  speedCheck() {
    if (this.game.stats.speed < this.game.stats.speedLimit) {
      console.log("faster!");
      this.game.transitionTo(new GameOver("You were too slow!"));
    }
  }

  /** Check for snek eating pellet. */
  snekPelletCollision() {
    for (let i = 0; i < this.game.pointerEventsSinceUpdate; i++) {
      if (
        intersection([this.game.snek.path[i], this.game.snek.path[i + 1]], {
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
    const gameElement = this.game.browserEnv.gameCanvas.element;
    gameElement.removeEventListener("pointerleave", this.snekLeave);
    gameElement.removeEventListener("pointermove", this.game.moveHandler);
    gameElement.removeEventListener("pointermove", this.game.snek.moveHandler);
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
    const reasonElement = document.getElementById("reason") as HTMLElement;
    reasonElement.innerText = this.reason;

    const scoreElement = document.getElementById("finalScore") as HTMLElement;
    scoreElement.innerText = `Score: ${this.game.stats.score}`;

    if (this.game.browserEnv.storageAvailable) {
      const finalBest = document.getElementById("finalBest") as HTMLElement;
      localStorage.setItem("bestScore", String(this.game.stats.bestScore));
      finalBest.innerText =
        `Best: ${this.game.stats.bestScore}` +
        (this.game.stats.score === this.game.stats.bestScore
          ? " (NEW BEST!)"
          : "");
    }

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
        this.game.transitionTo(new Title());
      },
      { once: true }
    );
  }

  public exit(): void {
    cancelAnimationFrame(this.game.reqId);
  }
}
