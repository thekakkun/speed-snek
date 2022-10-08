import { SpeedSnek } from "./speedSnek";

addEventListener("load", () => {
  dispatchEvent(new Event("newGame"));
});

let speedSnek: SpeedSnek;
const info = `\
==================

🐍 says,
  💽 See my source code here!
      https://github.com/thekakkun/speed-snek
  💸 Like what you see? Donate!
      https://ko-fi.com/kakkun

==================\
`;

addEventListener("newGame", () => {
  console.log(info);
  speedSnek = new SpeedSnek();
});
