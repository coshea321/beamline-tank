# Beamline Tank: backlog

Pending work and decisions on record. Check this before proposing a feature:
it may already be built, planned or turned down. When a PR closes an item, strike it
here in the same PR; record any decision Cathal makes, including "no".

## Ideas / next steps

- **Level editor:** palette, paint the grid, test play, and export the `rows` strings. The solver can run in the browser to validate (it is plain JS).
- **Bigger levels:** full 16×16 maps, like the original.
- **Hand-made hard tier:** replace the generated sectors 21–61 with hand-made puzzles.
- **Feel:** sound effects (start audio from a tap), haptics (`navigator.vibrate`) on death and win.
- **Move history:** show the move history. (The "show me" replay of the shortest solution is built: v1.10.)
- **Replay link of your own run:** shareable link that plays back a player's winning run. Offered, not chosen (Cathal picked the shortest-solution replay instead, 14 Oct 2026).
- ~~**Landscape layout:** put the board beside the controls in landscape on phones.~~ Built in v1.11: sideways shows only the board and controls.

## Decisions on record

- **Name:** "Beamline Tank", deliberately not "LaserTank". Artwork and levels are original; only the rules are borrowed.
- **Rules where the original was unclear** (HANDOVER.md § Rules as implemented): dead anti-tanks can be pushed;
  anti-tanks see through glass; anti-tank shots don't bounce off mirrors; belts don't move objects; thin ice
  ignores objects passing over it. Changing any of these moves pars and can break levels: confirm first.
- **No dependencies at runtime.** Playwright is for the smoke test only.
- **Progress is keyed by level name** (`blt2`), so levels can be reordered freely but not renamed casually.
- **Tap-to-shoot** (Cathal, 9 Oct 2026): tapping something you can't drive to aims and fires at it, mirror bounces included. Not built: "drive somewhere, then shoot" from one tap, which could pick routes the player didn't expect.
- **Tap-to-drive routing stays synchronous** (code review, 8 Oct 2026). Measured from every level's start, tapping every
  square: worst case about 6 ms and under 300 positions searched. Revisit only if much larger levels arrive.
- **Version number** (Cathal, 9 Oct 2026): a small version number in the header, from `package.json`. Bumped by hand in PRs players will notice.
- **Bulk levels** (Cathal, 10 Oct 2026): new extra-hard levels come from `tools/batch.js` (generated from scratch, near-copies rejected), about 10 per PR, so a cheaper model can run it. The sector strip groups sectors 20 at a time.
