import { Point } from "./geometry";
import { Cursor, Snek, Pellet, SpeedSnek } from "./model";

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

export class UiGraphics extends GraphicsComponent<SpeedSnek> {
  constructor(data: SpeedSnek, context: CanvasRenderingContext2D) {
    super(data, context);
  }

  draw() {
    const needleLoc = this.scaleX(this.data.smoothSpeed);

    // Speed limit line
    this.context.strokeStyle = "orangeRed";
    this.context.lineWidth = 5;
    this.context.beginPath();
    this.context.moveTo(this.scaleX(this.data.speedLimit), 0);
    this.context.lineTo(this.scaleX(this.data.speedLimit), 50);
    this.context.stroke();

    // Speedometer needle
    this.context.fillStyle = "green";
    this.context.beginPath();
    this.context.moveTo(needleLoc, 50);
    this.context.lineTo(needleLoc - 5, 0);
    this.context.lineTo(needleLoc + 5, 0);
    this.context.fill();
  }

  scaleX(value: number) {
    return (this.context.canvas.width * value) / this.data.maxSpeed;
  }
}
