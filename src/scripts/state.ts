import { Statement } from "typescript";

class GameState {
  private state: State;

  constructor(state: State) {
    this.transitionTo(state);
  }

  public transitionTo(state: State): void {
    this.state = state;
    this.state.setContext(this);
  }

  public next(): void {
    this.state.next();
  }
}

abstract class State {
  protected context: GameState;

  public setContext(context: GameState) {
    this.context = context;
  }

  public abstract next(): void;
}

// Display game instructions, show start button
class Title extends State {
  next() {
    this.context.transitionTo(new Ready());
  }
}

// // UI and snek are live, ready for user input
class Ready extends State {
  next() {
    this.context.transitionTo(new Set());
  }
}

// UI and snek are live, showing countdown
class Set extends State {
  next() {
    this.context.transitionTo(new Go());
  }
}

// game is live
class Go extends State {
  next() {
    this.context.transitionTo(new GameOver());
  }
}

// Snek is dead :(
class GameOver extends State {
  next() {
    this.context.transitionTo(new Title());
  }
}
