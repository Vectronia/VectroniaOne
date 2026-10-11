/**
 * The join between the hero and the page below it.
 *
 * The hero ends on its own accent colour; everything after it stands on the
 * navy backdrop. Left to meet, the two draw a line across the window.
 *
 * It belongs to the hero rather than to whatever follows. It used to sit at
 * the top of the panel component, which was the hero's neighbour at the time
 * and is not any more — since then it drew its own hard edge at the top of
 * three sections in the middle of the page, 18 steps each, which was more
 * than the seam it was meant to hide.
 *
 * The colours are not chosen, they are read off the hero's last row. That row
 * is not one colour: the stage carries an elliptical vignette, so it runs from
 * rgb(4 14 15) at either edge to rgb(9 28 30) in the middle. A single flat
 * colour was tried first and left a 17-step line at the edges. These stops
 * reproduce the measured profile across the width — in percentages, because
 * the same profile was measured at 1440 and at 390.
 *
 * The mask then takes the whole thing to nothing over a third of a screen, so
 * the top row matches the hero exactly and the bottom row is whatever the page
 * already was.
 *
 * It takes no height of its own: the gradient hangs over the head of the next
 * section, which is padding there and has nothing to cover.
 */
const LAST_ROW =
  "linear-gradient(to right," +
  " rgb(4 14 15) 0%," +
  " rgb(6 20 21) 12.5%," +
  " rgb(7 24 25) 25%," +
  " rgb(8 27 28) 37.5%," +
  " rgb(8 28 29) 50%," +
  " rgb(8 27 28) 62.5%," +
  " rgb(7 24 25) 75%," +
  " rgb(6 20 21) 87.5%," +
  " rgb(5 15 16) 100%)";

const RUN_OUT = "linear-gradient(to bottom, #000 0%, rgb(0 0 0 / 0.55) 45%, transparent 100%)";

export function HeroSeam() {
  return (
    <div aria-hidden className="relative z-0 h-0">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[34vh]"
        style={{
          background: LAST_ROW,
          maskImage: RUN_OUT,
          WebkitMaskImage: RUN_OUT,
        }}
      />
    </div>
  );
}
