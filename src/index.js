import Reveal from "./Reveal.js";
import Slider from "./Slider.js";
import Transition from "./Transition.js";

// Image-to-content transition; hands the gallery back when it is done
const transition = new Transition({ onClose: () => slider.start() });

// Slide reveals, created first so it can catch the slider's initial update
const reveal = new Reveal();

// Infinite scroll-driven slider; reports viewport enters/leaves to the reveal
const slider = new Slider({
  enabled: () => transition.state === "closed",
  onToggle: (changes, immediate) => reveal.toggle(changes, immediate),
});

// Gallery slides in DOM order
const slides = [...document.querySelectorAll(".gallery__slide")];

slides.forEach((slide, index) => {
  // Make each slide keyboard-focusable and announced as a button
  slide.setAttribute("tabindex", "0");
  slide.setAttribute("role", "button");

  // Only give up the gallery if the transition is going to hand it back
  const open = () => {
    if (transition.state !== "closed") return;

    slider.stop();
    transition.open(slide, index);
  };

  slide.addEventListener("click", open);
  slide.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  });
});

// Close the transition
document
  .querySelector(".content__back")
  .addEventListener("click", () => transition.close());
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") transition.close();
});
