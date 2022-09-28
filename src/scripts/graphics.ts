import { Arc, Path, Point } from "./geometry";
import { Snek } from "./model";
import { SpeedSnek } from "./speedSnek";

export function gameSize(): [number, number] {
  let width: number;
  let height: number;

  const ratio = 1.5;
  const maxWidth = 600;

  const dispHeight = document.documentElement.clientHeight;
  const dispWidth = document.documentElement.clientWidth;

  const uiHeight = document.getElementById("ui")?.clientHeight as number;

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
    const dpr = window.devicePixelRatio;
    this.element.width = Math.floor(this.width * dpr);
    this.element.height = Math.floor(this.height * dpr);

    // scale the output
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

export class SpeedGraphics extends GraphicsComponent<SpeedSnek> {
  composite: Composite;

  constructor(data: SpeedSnek, target: CanvasRenderingContext2D) {
    super(data, target);
    this.composite = new Composite();
  }

  render() {
    // speedometer background
    const speedCanvas = this.data.speedCanvas;
    const background = new CanvasRect(
      [
        { x: 0, y: 0 },
        { x: speedCanvas.width, y: speedCanvas.height },
      ],
      speedCanvas.context,
      "#eee"
    );

    // speed limit
    const speedLimit = new CanvasRect(
      [
        { x: 0, y: 0 },
        {
          x: (speedCanvas.width * this.data.speedLimit) / this.data.maxSpeed,
          y: speedCanvas.height,
        },
      ],
      speedCanvas.context,
      "orangered"
    );

    // speed indicator
    const indicator = new IndicatorGraphics(this.data, speedCanvas.context);

    this.composite.add(background);
    this.composite.add(speedLimit);
    this.composite.add(indicator);

    return this.composite.render();
  }
}

export class IndicatorGraphics extends GraphicsComponent<SpeedSnek> {
  constructor(data: SpeedSnek, target: CanvasRenderingContext2D) {
    super(data, target);
  }

  render() {
    const speedCanvas = this.data.speedCanvas;
    const speed = Math.min(this.data.snek.speed, this.data.maxSpeed);
    const indicatorLoc = (speedCanvas.width * speed) / this.data.maxSpeed;

    this.target.fillStyle = "green";
    this.target.beginPath();
    // left base
    this.target.moveTo(indicatorLoc - 5, this.data.speedCanvas.height);
    // right base
    this.target.lineTo(indicatorLoc + 5, this.data.speedCanvas.height);
    // right tip
    this.target.lineTo(indicatorLoc + 1, 10);
    // left tip
    this.target.lineTo(indicatorLoc - 1, 10);
    this.target.fill();
  }
}
