import { Point } from "./geometry";
import { Cursor, Snek, Pellet, Model } from "./model";

export class Canvas {
  height: number;
  width: number;
  element: HTMLCanvasElement;
  context: CanvasRenderingContext2D;

  constructor(id: string, width: number, height: number) {
    this.width = width;
    this.height = height;

    this.element = document.getElementById(id) as HTMLCanvasElement;
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
  public target: CanvasRenderingContext2D | HTMLElement;

  constructor(data: Type, context: CanvasRenderingContext2D | HTMLElement) {
    super();
    this.data = data;
    this.target = context;
  }
}

export class CursorGraphics extends GraphicsComponent<Cursor> {
  target: CanvasRenderingContext2D;

  constructor(data: Cursor, target: CanvasRenderingContext2D) {
    super(data, target);
  }

  render() {
    if (this.data.path.length !== 0) {
      this.target.strokeStyle = "red";
      this.target.lineWidth = 1;
      this.target.beginPath();
      this.target.moveTo(this.data.path[0].x, this.data.path[0].y);
      this.data.path.forEach((point: Point) => {
        this.target.lineTo(point.x, point.y);
      });
      this.target.stroke();
    }
  }
}

export class SnekGraphics extends GraphicsComponent<Snek> {
  target: CanvasRenderingContext2D;

  constructor(data: Snek, target: CanvasRenderingContext2D) {
    super(data, target);
  }

  render() {
    this.target.strokeStyle = "green";
    this.target.lineCap = "round";
    this.target.lineJoin = "round";
    this.target.lineWidth = this.data.snekWidth;
    this.target.beginPath();
    this.target.moveTo(this.data.path[0].x, this.data.path[0].y);
    this.data.path.forEach((point: Point) => {
      this.target.lineTo(point.x, point.y);
    });
    this.target.stroke();
  }
}

export class PelletGraphics extends GraphicsComponent<Pellet> {
  target: CanvasRenderingContext2D;

  constructor(data: Pellet, target: CanvasRenderingContext2D) {
    super(data, target);
  }

  render() {
    if (this.data.loc) {
      this.target.fillStyle = "blue";
      this.target.beginPath();
      this.target.arc(
        this.data.loc.x,
        this.data.loc.y,
        this.data.r,
        0,
        Math.PI * 2
      );
      this.target.fill();
    }
  }
}

export class CurrentScore extends GraphicsComponent<Model> {
  target: HTMLElement;

  constructor(data: Model, target: HTMLElement) {
    super(data, target);
  }

  render() {
    let display = `Score: ${String(this.data.score).padStart(2, "\xa0")}`;
    this.target.innerText = display;
  }
}

export class BestScore extends GraphicsComponent<Model> {
  target: HTMLElement;

  constructor(data: Model, target: HTMLElement) {
    super(data, target);
  }

  render() {
    let display = `Best: ${String(this.data.bestScore).padStart(2, "\xa0")}`;
    this.target.innerText = display;
  }
}

export class SpeedGraphics extends GraphicsComponent<Cursor> {
  target: CanvasRenderingContext2D;

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
