import { compileFunction } from "vm";
import { Arc, Path, Point } from "./geometry";
import { Cursor, Pellet } from "./model";

export function gameSize(uiHeight = 80): [number, number] {
  let width: number;
  let height: number;

  const ratio = 1.5;
  const maxWidth = 600;

  const dispHeight = document.documentElement.clientHeight;
  const dispWidth = document.documentElement.clientWidth;

  if ((dispHeight - uiHeight) / dispWidth < ratio) {
    height = Math.min(maxWidth, dispHeight - uiHeight);
    width = height * ratio;
  } else {
    width = Math.min(maxWidth, dispWidth);
    height = width * ratio;
  }

  return [width, height];
}

export class Canvas {
  height: number;
  width: number;
  element: HTMLCanvasElement;
  context: CanvasRenderingContext2D;

  constructor(id: string, width: number, height: number) {
    this.element = document.getElementById(id) as HTMLCanvasElement;
    this.setSize(width, height);
  }

  setSize(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;

    // Scale for high resolution displays
    const dpr = window.devicePixelRatio;
    this.element.width = Math.floor(width * dpr);
    this.element.height = Math.floor(height * dpr);

    // scale the output
    this.context = this.element.getContext("2d") as CanvasRenderingContext2D;
    this.context.scale(dpr, dpr);
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
  public target: CanvasRenderingContext2D;

  constructor(data: Type, context: CanvasRenderingContext2D) {
    super();
    this.data = data;
    this.target = context;
  }
}

export class CanvasLine extends GraphicsComponent<Path> {
  color: string;
  width: number;

  constructor(
    data: Path,
    target: CanvasRenderingContext2D,
    color: string,
    width: number
  ) {
    super(data, target);
    this.color = color;
    this.width = width;
  }

  render() {
    const path = this.data;

    if (path.length !== 0) {
      this.target.strokeStyle = this.color;
      this.target.lineWidth = this.width;
      this.target.lineCap = "round";
      this.target.lineJoin = "round";
      this.target.beginPath();
      this.target.moveTo(path[0].x, path[0].y);
      path.forEach((point: Point) => {
        this.target.lineTo(point.x, point.y);
      });
      this.target.stroke();
    }
  }
}

export class CanvasCircle extends GraphicsComponent<Arc> {
  color: string;
  width: number;

  constructor(
    data: Arc,
    target: CanvasRenderingContext2D,
    color: string,
    width: number
  ) {
    super(data, target);
    this.color = color;
    this.width = width;
  }

  render() {
    this.target.beginPath();
    this.target.strokeStyle = this.color;
    this.target.lineWidth = this.width;
    this.target.arc(
      this.data.center.x,
      this.data.center.y,
      this.data.radius,
      0,
      Math.PI * 2
    );
    this.target.stroke();
  }
}

export class CanvasDisc extends GraphicsComponent<Arc> {
  color: string;

  constructor(data: Arc, target: CanvasRenderingContext2D, color: string) {
    super(data, target);
    this.color = color;
  }

  render() {
    if (this.data.center) {
      this.target.fillStyle = this.color;
      this.target.beginPath();
      this.target.arc(
        this.data.center.x,
        this.data.center.y,
        this.data.radius,
        0,
        Math.PI * 2
      );
      this.target.fill();
    }
  }
}

export class CanvasRect extends GraphicsComponent<[Point, Point]> {
  color: string;

  constructor(
    data: [Point, Point],
    target: CanvasRenderingContext2D,
    color: string
  ) {
    super(data, target);
    this.color = color;
  }

  render() {
    const rectStart = this.data[0];
    const rectSize = {
      x: this.data[1].x - rectStart.x,
      y: this.data[1].y - rectStart.y,
    };

    this.target.fillStyle = this.color;
    this.target.fillRect(rectStart.x, rectStart.y, rectSize.x, rectSize.y);
  }
}

export class SpeedGraphics extends GraphicsComponent<Cursor> {
  constructor(data: Cursor, target: CanvasRenderingContext2D) {
    super(data, target);
  }

  render() {
    const padding = 10;
    const meterStart = {
      x: padding,
      y: padding,
    };
    const meterSize = {
      x: this.target.canvas.clientWidth - meterStart.x,
      y: this.target.canvas.clientHeight - padding * 2,
    };

    // Speedometer background
    this.target.fillStyle = "#eee";
    this.target.fillRect(meterStart.x, meterStart.y, meterSize.x, meterSize.y);

    // Speed limit
    this.target.fillStyle = "orangeRed";
    this.target.fillRect(
      meterStart.x,
      meterStart.y,
      (meterSize.x * this.data.speedLimit) / this.data.maxSpeed,
      meterSize.y
    );

    // Speedometer needle
    const speed = Math.min(this.data.smoothSpeed, this.data.maxSpeed);
    this.target.fillStyle = "green";
    this.target.beginPath();
    this.target.moveTo(
      (meterSize.x * speed) / this.data.maxSpeed - 5 + meterStart.x,
      meterStart.y + meterSize.y
    );
    this.target.lineTo(
      (meterSize.x * speed) / this.data.maxSpeed + 5 + meterStart.x,
      meterStart.y + meterSize.y
    );
    this.target.lineTo(
      (meterSize.x * speed) / this.data.maxSpeed + 1 + meterStart.x,
      meterStart.y + 10
    );
    this.target.lineTo(
      (meterSize.x * speed) / this.data.maxSpeed - 1 + meterStart.x,
      meterStart.y + 10
    );
    this.target.fill();
  }
}
