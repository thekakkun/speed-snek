import { SpeedSnek } from "./speedSnek";

window.addEventListener("load", () => {
  let speedSnek = new SpeedSnek();
  speedSnek.gameLoop();
});
