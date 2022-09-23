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

  public abstract draw(): void;
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

  public draw() {
    for (const child of this.children) {
      child.draw();
    }
  }
}

abstract class GraphicsComponent<Type> extends Component {
  public data: Type;
  public context: CanvasRenderingContext2D;

  constructor(data: Type, context: CanvasRenderingContext2D) {
    super();
    this.data = data;
    this.context = context;
  }
}

export class CursorGraphics extends GraphicsComponent<Cursor> {
  constructor(data: Cursor, context: CanvasRenderingContext2D) {
    super(data, context);
  }

  draw() {
    if (this.data.path.length !== 0) {
      this.context.strokeStyle = "red";
      this.context.lineWidth = 1;
      this.context.beginPath();
      this.context.moveTo(this.data.path[0].x, this.data.path[0].y);
      this.data.path.forEach((point: Point) => {
        this.context.lineTo(point.x, point.y);
      });
      this.context.stroke();
    }
  }
}

export class SnekGraphics extends GraphicsComponent<Snek> {
  constructor(data: Snek, context: CanvasRenderingContext2D) {
    super(data, context);
  }

  draw() {
    this.context.strokeStyle = "green";
    this.context.lineCap = "round";
    this.context.lineJoin = "round";
    this.context.lineWidth = this.data.snekWidth;
    this.context.beginPath();
    this.context.moveTo(this.data.path[0].x, this.data.path[0].y);
    this.data.path.forEach((point: Point) => {
      this.context.lineTo(point.x, point.y);
    });
    this.context.stroke();
  }
}

export class PelletGraphics extends GraphicsComponent<Pellet> {
  constructor(data: Pellet, context: CanvasRenderingContext2D) {
    super(data, context);
  }

  draw() {
    if (this.data.loc) {
      this.context.fillStyle = "blue";
      this.context.beginPath();
      this.context.arc(
        this.data.loc.x,
        this.data.loc.y,
        this.data.r,
        0,
        Math.PI * 2
      );
      this.context.fill();
    }
  }
}

export class ScoreGraphics extends GraphicsComponent<Model> {
  constructor(data: Model, context: CanvasRenderingContext2D) {
    super(data, context);
  }

  draw() {
    this.context.font = "25px monospace";
    this.context.fillStyle = "black";
    this.context.fillText(`Score: ${this.data.score}`, 0, 30);
    this.context.fillText(` Best: ${this.data.maxScore}`, 0, 60);
  }
}

export class SpeedGraphics extends GraphicsComponent<Cursor> {
  constructor(data: Cursor, context: CanvasRenderingContext2D) {
    super(data, context);
  }

  draw() {
    const padding = 10;
    const meterStart = {
      x: 160,
      y: padding,
    };
    const meterSize = {
      x: this.context.canvas.clientWidth - meterStart.x,
      y: this.context.canvas.clientHeight - padding * 2,
    };

    // Speedometer background
    this.context.fillStyle = "#eee";
    this.context.fillRect(meterStart.x, meterStart.y, meterSize.x, meterSize.y);

    // Speed limit
    this.context.fillStyle = "orangeRed";
    this.context.fillRect(
      meterStart.x,
      meterStart.y,
      (meterSize.x * this.data.speedLimit) / this.data.maxSpeed,
      meterSize.y
    );

    // Speedometer needle
    const speed = Math.min(this.data.smoothSpeed, this.data.maxSpeed);
    this.context.fillStyle = "green";
    this.context.beginPath();
    this.context.moveTo(
      (meterSize.x * speed) / this.data.maxSpeed - 5 + meterStart.x,
      meterStart.y + meterSize.y
    );
    this.context.lineTo(
      (meterSize.x * speed) / this.data.maxSpeed + 5 + meterStart.x,
      meterStart.y + meterSize.y
    );
    this.context.lineTo(
      (meterSize.x * speed) / this.data.maxSpeed + 1 + meterStart.x,
      meterStart.y + 10
    );
    this.context.lineTo(
      (meterSize.x * speed) / this.data.maxSpeed - 1 + meterStart.x,
      meterStart.y + 10
    );
    this.context.fill();
  }
}
