# Speed Snek

The game of Snake, _on speed_!

This game is still in development. [Read more about the implementation here](https://thekakkun.github.io/blog?tag=speed+snek).

## What is it?

A mash-up of the classic [computer game Snake](<https://en.wikipedia.org/wiki/Snake_(video_game_genre)>) and the [1994 movie Speed](<https://en.wikipedia.org/wiki/Speed_(1994_film)>) starring Keanu Reeves and Sandra Bullock. Control the snake with your finger to eat pellets. Game over if you go under the speed limit, or if you crash into yourself or the walls.

This project was used to teach myself about:

- Object oriented programming
- [TypeScript](https://www.typescriptlang.org/)
- HTML canvas
- [Parcel](https://parceljs.org/)

## The rules of the game

- Control the snake with your finger (recommended) or mouse.
- Eating pellets will increase:
  - your score
  - the length of your snake
  - the minimum speed limit
- Game over if you:
  - Hit yourself
  - Hit the wall
  - Go under the minimum speed limit for 5 seconds
