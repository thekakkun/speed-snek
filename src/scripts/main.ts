import { SpeedSnek } from "./speedSnek";

addEventListener(
  "load",
  () => {
    console.log(
      '🐍 says,\n"see my source code here: https://github.com/thekakkun/speed-snek!"'
    );
    const speedSnek = new SpeedSnek();
  },
  { once: true }
);
