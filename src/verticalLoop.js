import { gsap } from "gsap";

/** Animate items along the y-axis in a loop */
export default function verticalLoop(items, config) {
  items = gsap.utils.toArray(items);
  config = config || {};

  // Endless timeline
  const tl = gsap.timeline({
    repeat: config.repeat,
    paused: config.paused,
    defaults: { ease: "none" },
    onReverseComplete: () => {
      // Keep the playhead in range when playing backwards past zero
      tl.totalTime(tl.rawTime() + tl.duration() * 100);
    },
  });

  const length = items.length;

  // Measure from the top so any top padding is travelled before a wrap
  const startY = 0;

  // Height of each item, in px
  const heights = [];

  // Starting y of each item, relative to its height
  const yPercents = [];

  // Travel speed: speed 1 = 100px per second
  const pixelsPerSecond = (config.speed || 1) * 100;

  // Round yPercent values so items land on whole pixels
  const snap = config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1);

  // Measure each item and convert its y into a height-relative yPercent
  gsap.set(items, {
    yPercent: (i, el) => {
      const h = (heights[i] = parseFloat(gsap.getProperty(el, "height", "px")));
      yPercents[i] = snap(
        (parseFloat(gsap.getProperty(el, "y", "px")) / h) * 100 + gsap.getProperty(el, "yPercent"),
      );
      return yPercents[i];
    },
  });
  gsap.set(items, { y: 0 });

  // Full container length, including the spacing at the wrap seam
  const totalHeight =
    items[length - 1].offsetTop +
    (yPercents[length - 1] / 100) * heights[length - 1] -
    startY +
    items[length - 1].offsetHeight * gsap.getProperty(items[length - 1], "scaleY") +
    (parseFloat(config.paddingBottom) || 0);

  // Two tweens per item: exit top, then re-enter from the bottom
  for (let i = 0; i < length; i++) {
    const item = items[i];

    // Current y offset in px
    const curY = (yPercents[i] / 100) * heights[i];

    // Distance to the container's top edge
    const distanceToStart = item.offsetTop + curY - startY;

    // Distance until fully off-screen top
    const distanceToLoop = distanceToStart + heights[i] * gsap.getProperty(item, "scaleY");

    // Travel up until fully off-screen
    tl.to(
      item,
      {
        yPercent: snap(((curY - distanceToLoop) / heights[i]) * 100),
        duration: distanceToLoop / pixelsPerSecond,
      },
      0,
    ).fromTo(
      // Then re-enter from the bottom end of the container
      item,
      {
        yPercent: snap(((curY - distanceToLoop + totalHeight) / heights[i]) * 100),
      },
      {
        yPercent: yPercents[i],
        duration: (totalHeight - distanceToLoop) / pixelsPerSecond,
        immediateRender: false,
      },
      distanceToLoop / pixelsPerSecond,
    );
  }

  // Pre-render every tween to avoid a first-frame jump
  tl.progress(1, true).progress(0, true);

  return tl;
}
