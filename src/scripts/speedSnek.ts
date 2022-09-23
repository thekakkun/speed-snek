import { Statement } from "typescript";

class Context {
  private state: State;

  constructor(state: State) {
    this.transitionTo(state);
  }

  public transitionTo(state: State): void {
    this.state = state;
    this.state.setContext(this);
  }

  public update(): void {
    this.state.update();
  }

  public draw(): void {
    this.state.update();
  }
}

abstract class State {
  protected context: Context;

  public setContext(context: Context) {
    this.context = context;
  }

  public abstract draw(): void;
  public abstract update(): void;
}

class Title extends State {
  // Display game instructions, show start button

  public draw(): void {}
  public update(): void {}
}

class Ready extends State {
  // UI and snek are live, ready for user input
  public draw(): void {}
  public update(): void {}
}

class Set extends State {
  // UI and snek are live, showing countdown
  public draw(): void {}
  public update(): void {}
}

class Go extends State {
  // game is live
  public draw(): void {}
  public update(): void {}
}

class GameOver extends State {
  // Snek is dead :(
  public draw(): void {}
  public update(): void {}
}
