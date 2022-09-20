export abstract class GraphicsComponent {
  protected parent!: GraphicsComponent | null;
  public target?: HTMLCanvasElement;
  public reqId: number;

  constructor(target?: HTMLCanvasElement) {
    this.target = target;
  }

  public setParent(parent: GraphicsComponent | null) {
    this.parent = parent;
  }

  public getParent(): GraphicsComponent | null {
    return this.parent;
  }

  public abstract draw(): void;
}

export class GraphicsComposite extends GraphicsComponent {
  protected children: GraphicsComponent[];
  public target: HTMLCanvasElement;

  constructor(target?: HTMLCanvasElement) {
    super(target);
    this.children = [];
    this.draw = this.draw.bind(this);
  }

  public add(component: GraphicsComponent) {
    if (component.target === undefined) {
      component.target = this.target;
    }

    this.children.push(component);
    component.setParent(this);
  }

  public remove(component: GraphicsComponent) {
    const ix = this.children.indexOf(component);
    this.children.splice(ix, 1);
  }

  public draw() {
    if (this.parent && this.parent.target === undefined) {
      const context = this.target.getContext("2d") as CanvasRenderingContext2D;
      context.clearRect(0, 0, this.target.width, this.target.height);
    }
    for (const child of this.children) {
      child.draw();
    }
  }
}
