export abstract class GraphicsComponent {
  protected parent!: GraphicsComponent | null;
  public target: HTMLCanvasElement | null;
  public reqId: number;

  constructor(target?: HTMLCanvasElement) {
    this.target = target ? target : null;
  }

  public setParent(parent: GraphicsComponent | null) {
    this.parent = parent;
  }

  public getParent(): GraphicsComponent | null {
    return this.parent;
  }

  public getTarget(): HTMLCanvasElement | null {
    if (this.target !== null) {
      return this.target;
    }
    return this.parent ? this.parent.getTarget() : null;
  }

  public abstract draw(): void;
}

export class GraphicsComposite extends GraphicsComponent {
  protected children: GraphicsComponent[];

  constructor(target?: HTMLCanvasElement) {
    super(target);
    this.children = [];
    this.draw = this.draw.bind(this);
  }

  public add(component: GraphicsComponent) {
    if (component.target === null) {
      component.target = this.getTarget();
    }

    this.children.push(component);
    component.setParent(this);
  }

  public remove(component: GraphicsComponent) {
    const ix = this.children.indexOf(component);
    this.children.splice(ix, 1);
  }

  public draw() {
    if (this.target && this.parent?.getTarget() === null) {
      const context = this.target.getContext("2d") as CanvasRenderingContext2D;
      context.clearRect(0, 0, this.target.width, this.target.height);
    }
    for (const child of this.children) {
      child.draw();
    }
  }
}
