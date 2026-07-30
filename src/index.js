import imagesLoaded from "imagesloaded";

import Reveal from "./Reveal.js";
import Slider from "./Slider.js";
import Transition from "./Transition.js";

imagesLoaded(document.body, () => {
  document.body.classList.remove("loading");
  init();
});

function init() {
  // Image-to-content transition
  const transition = new Transition();

  // Slide reveals
  const reveal = new Reveal();

  // Infinite slider
  const slider = new Slider({
    enabled: () => transition.state === "closed",
    onToggle: (changes) => reveal.toggle(changes),
  });

  // Gallery slides
  const slides = [...document.querySelectorAll(".gallery__slide")];

  slides.forEach((slide, index) => {
    slide.setAttribute("tabindex", "0");
    slide.setAttribute("role", "button");

    slide.addEventListener("click", () => {
      slider.stop();
      transition.open(slide, index);
    });

    slide.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        slider.stop();
        transition.open(slide, index);
      }
    });
  });

  document.querySelector(".content__back").addEventListener("click", () => transition.close());

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") transition.close();
  });
}
