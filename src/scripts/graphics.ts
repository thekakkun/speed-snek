import { Arc, Path, Point } from "./geometry";
import { SpeedSnek } from "./speedSnek";

export const white = "#fdfffc";
export const red = "#ff3333";
export const green = "#94e34f";
export const blue = "#49b9e6";
export const background = "#040406";

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

export class Canvas {
  height: number;
  width: number;
  element: HTMLCanvasElement;
  context: CanvasRenderingContext2D;

  constructor(id: string, width?: number, height?: number) {
    this.element = document.getElementById(id) as HTMLCanvasElement;
    this.context = this.element.getContext("2d") as CanvasRenderingContext2D;

    if (width === undefined) {
      width = this.element.clientWidth;
    }
    if (height === undefined) {
      height = this.element.clientHeight;
    }

    this.width = width;
    this.height = height;

    this.setSize();
  }

  setSize() {
    this.element.style.width = `${this.width}px`;
    this.element.style.height = `${this.height}px`;

    // Scale for high resolution displays
    this.element.width = Math.floor(this.width * devicePixelRatio);
    this.element.height = Math.floor(this.height * devicePixelRatio);

    // scale the output
    this.context.scale(devicePixelRatio, devicePixelRatio);
  }

  clear() {
    this.context.clearRect(0, 0, this.width, this.height);
  }
}

abstract class Component {
  protected parent!: Component | null;

  public setParent(parent: Component | null) {
    this.parent = parent;
  }

  public getParent(): Component | null {
    return this.parent;
  }

  public abstract render(): void;
}

export class Composite extends Component {
  protected children: Component[] = [];

  public add(component: Component) {
    this.children.push(component);
    component.setParent(this);
  }

  public remove(component: Component) {
    const ix = this.children.indexOf(component);
    this.children.splice(ix, 1);

    component.setParent(null);
  }

  public render() {
    for (const child of this.children) {
      child.render();
    }
  }
}

abstract class GraphicsComponent<Type> extends Component {
  public data: Type;
  public canvas: Canvas;

  constructor(data: Type, canvas: Canvas) {
    super();
    this.data = data;
    this.canvas = canvas;
  }
}

export class CanvasLine extends GraphicsComponent<Path> {
  color: string;
  width: number;

  constructor(data: Path, canvas: Canvas, color: string, width: number) {
    super(data, canvas);
    this.color = color;
    this.width = width;
  }

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

export class CanvasCircle extends GraphicsComponent<Arc> {
  color: string;
  width: number;

  constructor(data: Arc, canvas: Canvas, color: string, width: number) {
    super(data, canvas);
    this.color = color;
    this.width = width;
  }

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

export class CanvasDisc extends GraphicsComponent<Arc> {
  color: string;

  constructor(data: Arc, canvas: Canvas, color: string) {
    super(data, canvas);
    this.color = color;
  }

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

export class CanvasRect extends GraphicsComponent<[Point, Point]> {
  color: string;

  constructor(data: [Point, Point], canvas: Canvas, color: string) {
    super(data, canvas);
    this.color = color;
  }

  render() {
    const rectStart = this.data[0];
    const rectSize = {
      x: this.data[1].x - rectStart.x,
      y: this.data[1].y - rectStart.y,
    };
    const ctx = this.canvas.context;

    ctx.fillStyle = this.color;
    ctx.fillRect(rectStart.x, rectStart.y, rectSize.x, rectSize.y);
  }
}

export class SpeedGraphics extends GraphicsComponent<SpeedSnek> {
  constructor(data: SpeedSnek, canvas: Canvas) {
    super(data, canvas);
  }

  render() {
    const barWidth = 5;
    const margin = 3;
    const border = parseInt(getComputedStyle(this.canvas.element).borderWidth);
    const bars = Math.floor(
      (this.canvas.width - border) / (barWidth + margin)
    );

    const speedLimitPercent = this.data.speedLimit / this.data.maxSpeed;
    const speedPercent = this.data.snek.speed / this.data.maxSpeed;

    const ctx = this.canvas.context;
    let color: typeof red | typeof white | typeof background;

    for (let i = 0; i <= bars; i++) {
      if (
        (border + (barWidth + margin) * i - margin) /
          (this.canvas.width - border * 2) <
        speedLimitPercent
      ) {
        color = red;
      } else if (
        (border + (barWidth + margin) * i - margin) /
          (this.canvas.width - border * 2) <
        speedPercent
      ) {
        color = white;
      } else {
        color = background;
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = barWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo((barWidth + margin) * i + barWidth / 2, margin);
      ctx.lineTo(
        (barWidth + margin) * i + barWidth / 2,
        this.canvas.height - margin
      );
      ctx.stroke();
    }
  }
}
