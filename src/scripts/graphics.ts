import { Arc, Path, Point } from "./geometry";
import { GameStats, SpeedSnek } from "./speedSnek";
import styles from "../styles/palette.module.scss";

/**
 * Calculate the game canvas size and orientation, based on available space.
 * @returns The width and height of the game canvas.
 */
export function gameSize(): [number, number] {
  let width: number;
  let height: number;

  const ratio = 1.5;
  const maxSide = 600;
  const borderWidth = parseInt(
    getComputedStyle(document.getElementById("game") as HTMLElement).borderWidth
  );

  const dispHeight = document.documentElement.clientHeight;
  const dispWidth = document.documentElement.clientWidth;

  const uiHeight = document.getElementById("ui")?.clientHeight as number;

  if ((dispHeight - uiHeight) / dispWidth < 1) {
    height = Math.min(maxSide, dispHeight - uiHeight - borderWidth * 2);
    width = height * ratio;
  } else {
    width = Math.min(maxSide, dispWidth - borderWidth * 2);
    height = width * ratio;
  }

  return [width, height];
}

/** Class representing the canvas object. */
export class Canvas {
  height: number;
  width: number;
  element: HTMLCanvasElement;
  context: CanvasRenderingContext2D;

  /**
   * Create a Canvas.
   * @param id The id of the canvas.
   * @param width Width of the canvas, pulled from calcualted width if omitted.
   * @param height Width of the canvas, pulled from calcualted width if omitted.
   */
  constructor(id: string, width?: number, height?: number) {
    this.element = document.getElementById(id) as HTMLCanvasElement;
    this.context = this.element.getContext("2d") as CanvasRenderingContext2D;

    this.width = width ?? this.element.clientWidth;
    this.height = height ?? this.element.clientHeight;

    this.setSize();
  }

  /**
   * Scales the canvas so that there is no blurring for high density displays.
   */
  setSize() {
    this.element.style.width = `${this.width}px`;
    this.element.style.height = `${this.height}px`;

    this.element.width = Math.floor(this.width * devicePixelRatio);
    this.element.height = Math.floor(this.height * devicePixelRatio);

    this.context.scale(devicePixelRatio, devicePixelRatio);
  }

  /** wipe the canvas clean. */
  clear() {
    this.context.clearRect(0, 0, this.width, this.height);
  }
}

/** Defines the need for a render() method for
 * both complex and simple Components. */
abstract class Component {
  protected parent!: Component | null;

  /**
   * Set the parent Component.
   * @param parent The parent Component.
   */
  public setParent(parent: Component | null) {
    this.parent = parent;
  }

  /**
   * Get the parent Component.
   * @returns The parent Component or null if no parent.
   */
  public getParent(): Component | null {
    return this.parent;
  }

  public abstract render(): void;
}

/**
 * Composite objects represent complex Components with children.
 * Calling render() will delegate actual work to its children.
 * @extends Component
 */
export class Composite extends Component {
  protected children: Component[] = [];

  /**
   * Adds a child component.
   * @param component The child component to add to Compsite.
   */
  public add(component: Component) {
    this.children.push(component);
    component.setParent(this);
  }

  /**
   * Removes a child component.
   * @param component The child component to remove from Composite.
   */
  public remove(component: Component) {
    const ix = this.children.indexOf(component);
    this.children.splice(ix, 1);

    component.setParent(null);
  }

  /** Delegate render() method to its children. */
  public render() {
    for (const child of this.children) {
      child.render();
    }
  }
}

/**
 * A Component with parameters defining the data source and output target
 * @extends Component
 */
abstract class GraphicsComponent<Type> extends Component {
  public data: Type;
  public canvas: Canvas;

  /**
   * Create a GraphicsComponent
   * @param data The data source.
   * @param canvas Canvas to render data on.
   */
  constructor(data: Type, canvas: Canvas) {
    super();
    this.data = data;
    this.canvas = canvas;
  }
}

/**
 * Used to draw a line on the canvas.
 * @extends GraphicsComponent
 */
export class CanvasLine extends GraphicsComponent<Path> {
  color: string;
  width: number;

  /**
   * Constructs a CanvasLine
   * @param data A list of coordinates for the line.
   * @param canvas The Canvas to render to.
   * @param color The color of the line.
   * @param width The width of the line.
   */
  constructor(data: Path, canvas: Canvas, color: string, width: number) {
    super(data, canvas);
    this.color = color;
    this.width = width;
  }

  /** Draw a line on the canvas. */
  render() {
    const path = this.data;
    const ctx = this.canvas.context;

    if (path.length !== 0) {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      path.forEach((point: Point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
  }
}

/**
 * Used to draw a circle (unfilled) on the canvas.
 * @extends GraphicsComponent
 */
export class CanvasCircle extends GraphicsComponent<Arc> {
  color: string;
  width: number;

  /**
   * Constructs a CanvasCircle.
   * @param data The center and radius of the circle
   * @param canvas The Canvas to render to.
   * @param color The color of the circle.
   * @param width The width of the line.
   */
  constructor(data: Arc, canvas: Canvas, color: string, width: number) {
    super(data, canvas);
    this.color = color;
    this.width = width;
  }

  /** Draw a circle on the canvas. */
  render() {
    const ctx = this.canvas.context;
    ctx.beginPath();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.width;
    ctx.arc(
      this.data.center.x,
      this.data.center.y,
      this.data.radius,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }
}

/**
 * Used to draw a disc (filled) on the canvas.
 * @extends GraphicsComponent
 */
export class CanvasDisc extends GraphicsComponent<Arc> {
  color: string;

  /**
   * Constructs a CanvasDisc
   * @param data The center and radius of the circle
   * @param canvas The Canvas to render to.
   * @param color The color of the circle.
   */
  constructor(data: Arc, canvas: Canvas, color: string) {
    super(data, canvas);
    this.color = color;
  }

  /** Draw a disc on the canvas. */
  render() {
    if (this.data.center) {
      const ctx = this.canvas.context;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(
        this.data.center.x,
        this.data.center.y,
        this.data.radius,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}

/**
 * Used to draw the speedometer.
 * @extends GraphicsComponent
 */
export class SpeedGraphics extends GraphicsComponent<GameStats> {
  barWidth: number;
  margin: number;
  border: number;
  barCount: number;

  /**
   * Construct a SpeedGraphics.
   * @param data contains various pieces of data regarding speed.
   * @param canvas The Canvas to render to.
   */
  constructor(data: GameStats, canvas: Canvas) {
    super(data, canvas);

    this.barWidth = 6;
    this.margin = 3;
    this.border = parseInt(getComputedStyle(canvas.element).borderWidth);
    this.barCount = Math.floor(
      (canvas.width - this.border) / (this.barWidth + this.margin)
    );
  }

  /** Draw the speedometer */
  render() {
    const speedLimitPercent = this.data.speedLimit / this.data.maxSpeed;
    const speedPercent = this.data.speed / this.data.maxSpeed;

    const ctx = this.canvas.context;
    let color: string;

    for (let i = 0; i <= this.barCount; i++) {
      const colorBoundary =
        (this.border + (this.barWidth + this.margin) * i - this.margin) /
        (this.canvas.width - this.border * 2);

      if (colorBoundary < speedLimitPercent) {
        color = styles.red;
      } else if (colorBoundary < speedPercent) {
        color = styles.white;
      } else {
        color = styles.black;
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = this.barWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(
        (this.barWidth + this.margin) * i + this.barWidth / 2,
        this.barWidth / 2
      );
      ctx.lineTo(
        (this.barWidth + this.margin) * i + this.barWidth / 2,
        this.canvas.height - this.barWidth / 2
      );
      ctx.stroke();
    }
  }
}
