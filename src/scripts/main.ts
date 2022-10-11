import { SpeedSnek } from "./speedSnek";

addEventListener("load", () => {
  const speedSnek = new SpeedSnek();
  speedSnek.newGame();

  console.log(`\
==================

🐍 says,
  💽 See my source code here!
      https://github.com/thekakkun/speed-snek
  💸 Like what you see? Donate!
      https://ko-fi.com/kakkun

==================\
  `);
});
