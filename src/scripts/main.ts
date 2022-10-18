import { SpeedSnek, Title } from "./speedSnek";

addEventListener("load", () => {
  console.log(`
🐍 says,

  💽 See my source code here!
      https://github.com/thekakkun/speed-snek

  💸 Speed Snek is strong enough to stand on its own two feet.
     But you can help support its creator here!
      https://ko-fi.com/kakkun

  `);
  const speedSnek = new SpeedSnek(new Title());
});
