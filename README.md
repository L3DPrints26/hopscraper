# HOPSCRAPER

A browser platformer about a square that jumps. One HTML file, no dependencies, no internet needed.

**Play it: https://l3dprints26.github.io/hopscraper/**

## What's in it

- **33 hand-built levels** across four worlds and a finale tower
- **Speed Courses** — four non-stop courses (230 to 470 tiles) with bronze/silver/gold medals
- **Endless** — a procedurally generated tower with rising lava that never stops
- **Daily Climb** — one tower per day, the same one for everybody
- **Marathon** — all 33 levels back to back on a single timer
- **Hard Mode** — one air jump instead of two, no checkpoints, and two stacked modifiers per level
  (mirrored, inverted, upside-down gravity, black ice, walls-only jumping, laser storms, saw storms, chaos gravity)
- **Hard Marathon** — all 33 hard levels in one run
- A shop with skins, hats and trails, plus 23 trophies

## Controls

| Action | Keys |
| --- | --- |
| Move | Arrow keys or A / D |
| Jump | Space, W, or Up — again in mid-air |
| Drop through a platform | Down |
| Restart | R |
| Pause | Esc |
| Music on/off | M |

Air jumps refill when you land **or** when you touch a wall, so you can climb tight shafts by bouncing between walls.

## Under the hood

Written in plain JavaScript on a single canvas. Custom platformer physics with coyote time, jump buffering, variable jump height and wall jumps. All sound is synthesised at runtime with the Web Audio API — no audio files. All art is drawn in code and cached into tile atlases, so the whole game is one file.

Every level was verified beatable by a physics bot that plays each one with the real game physics, trying twelve movement patterns from every standing position, checking the exit, every gem and every key.

## Credits

Developed by **Lucas Lupton** — design, level design, direction and testing.
Built with code assistance from Claude (Anthropic), under the developer's direction.
