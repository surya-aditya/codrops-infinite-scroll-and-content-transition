import { gsap } from "gsap";
import { Observer } from "gsap/Observer";
import verticalLoop from "./verticalLoop.js";

gsap.registerPlugin(Observer);

/** Infinite slider driven by wheel/touch scrolling */
export default class Slider {
  constructor({ enabled = () => true, onToggle } = {}) {
    this.enabled = enabled;

    // Called with the slides that just entered or left the viewport
    this.onToggle = onToggle;

    this.createLoop();
    this.createParallax();
    this.createScrub();
    this.createObserver();

    this.resize();
  }

  /** Build vertical loop from the gallery slides */
  createLoop() {
    const gallery = document.querySelector(".gallery");

    // The gap between slides doubles as the loop's bottom padding
    const gap = parseFloat(getComputedStyle(gallery).rowGap);

    // A paused one lap timeline; its playhead is our scroll position
    this.loop = verticalLoop(".gallery__slide", {
      repeat: -1,
      paused: true,
      paddingBottom: gap,
    });

    // Wrapping the playhead past either end is what makes it endless
    this.wrap = gsap.utils.wrap(0, this.loop.duration());
  }

  /** Give each slide its own travel speed for a sense of depth */
  createParallax() {
    // Speed multipliers: > 1 faster, < 1 slower
    const speeds = [1.3, 0.8, 1.15, 0.7, 1.25, 0.85];

    this.parallax = gsap.utils.toArray(".gallery__slide").map((slide, i) => ({
      el: slide,
      factor: speeds[i % speeds.length] - 1,
      offset: 0,
      visible: false,
    }));

    // Scatter the resting positions too
    this.applyParallax();
  }

  /** Offset each slide by its speed factor, report viewport enters/leaves */
  applyParallax(immediate = false) {
    const changes = [];

    this.parallax.forEach((item) => {
      const rect = item.el.getBoundingClientRect();

      // The slide's position without our offset
      const loopTop = rect.top - item.offset;

      // Offset by the speed factor; zero at the wrap point
      item.offset = item.factor * (loopTop + rect.height);
      gsap.set(item.el, { y: item.offset });

      // Check visibility from the final position
      const top = loopTop + item.offset;
      const visible = top < window.innerHeight && top + rect.height > 0;

      // Collect the slides that entered or left
      if (visible !== item.visible) {
        item.visible = visible;
        changes.push({ el: item.el, visible, top });
      }
    });

    if (changes.length) this.onToggle?.(changes, immediate);
  }

  /** Create the eased playhead that smooths scroll input into loop time */
  createScrub() {
    // Proxy object standing in for the scroll position
    this.playhead = { time: 0 };

    // Eases the playhead toward the latest scroll target
    this.scrub = gsap.to(this.playhead, {
      time: 0,
      duration: 0.75,
      ease: "power3.out",
      paused: true,
      onUpdate: () => {
        this.loop.time(this.wrap(this.playhead.time));
        this.applyParallax();
      },
    });
  }

  /** Listen for wheel and touch input */
  createObserver() {
    this.observer = Observer.create({
      target: window,
      type: "wheel,touch",
      preventDefault: true,
      onChange: (self) => {
        this.scroll(self);
      },
    });
  }

  /** Rebuild the loop when the viewport size settles */
  resize() {
    let id;

    window.addEventListener("resize", () => {
      clearTimeout(id);
      id = setTimeout(() => {
        this.rebuild();
      }, 200);
    });
  }

  /** Move the scrub target by the scrolled distance */
  scroll({ deltaX, deltaY }) {
    if (!this.enabled()) return;

    // Swipes (x or y) all drive the gallery
    const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;

    // Slides travel 100px per playhead second, so px / 100 gives time
    this.scrub.vars.time += delta / 100;
    this.scrub.invalidate().restart();
  }

  /** Freeze the inertia in place so a transition can take over */
  freeze() {
    this.scrub.pause();

    // Sync the target to where we stopped, so the next scroll ramps from here
    this.scrub.vars.time = this.playhead.time;
    this.scrub.invalidate();
  }

  /** Hand the gallery over to a transition */
  stop() {
    this.observer.disable();

    this.freeze();
  }

  /** Take the gallery back once a transition has finished with it */
  start() {
    this.observer.enable();
  }

  /** Re-measure and rebuild the loop, preserving the current position */
  rebuild() {
    // 0 to 1 progress
    const progress = this.loop.progress();

    // Drop the old timeline and its transforms; the stagger lives in the CSS
    this.freeze();
    this.loop.kill();
    gsap.set(".gallery__slide", { clearProps: "transform" });

    // Re-measure the new viewport size and restore the position
    this.createLoop();
    this.loop.progress(progress, true);

    // Re-measured rather than travelled, so the reveals snap, not replay
    this.parallax.forEach((item) => (item.offset = 0));
    this.applyParallax(true);

    // Re-sync the scrub to the rebuilt loop's timing
    this.playhead.time = this.loop.time();
    this.scrub.vars.time = this.playhead.time;
    this.scrub.invalidate();
  }
}
