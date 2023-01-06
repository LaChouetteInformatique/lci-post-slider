/**
 * lci-post-slider ACF Block Javascrip entry point.
 *
 * @package lci-post-slider
 */

/**
 * WordPress i18n
 *
 * __( '__', 'my-domain' );
 * _x( '_x', '_x_context', 'my-domain' );
 * _n( '_n_single', '_n_plural', number, 'my-domain' );
 * _nx( '_nx_single', '_nx_plural', number, '_nx_context', 'my-domain' );
 */
// require using babel + installing @wordpress/i18n npm packages
import { __, _x, _n, _nx } from "@wordpress/i18n";
(function () {
  // i18n when not using babel. No need to install @wordpress/i18n npm packages then
  // const { __, _x, _n, _nx } = wp.i18n;

  // DO NOT USE variable textDomain in i18n function or wp-cli i18n make-pot command wont find translations
  // const textDomain = "lci-post-slider";

  /**
   * Check if DOM is already available to launch script or add event listener to do so as soon as possible
   * https://stackoverflow.com/a/9899701
   */
  let docReady = (fn) => {
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      // call on next available tick
      setTimeout(fn, 1);
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  };

  docReady(function () {
    // DOM is loaded and ready for manipulation here
    console.log(__("lci-post-slider.js started !", "lci-post-slider"));
    try {
      // Get flickity sliders and initialize them
      let sliders = document.querySelectorAll(".lci-post-slider");

      // console.log(sliders);

      // If we use babel
      [...sliders].forEach((slider) => {
        initializeBlock(slider);
      });

      // If not using babel
      // for (var i = 0, len = sliders.length; i < len; i++) {
      //   initializeBlock(sliders[i]);
      // }
    } catch (error) {
      console.error(e);
    }
  });

  /**
   * initializeBlock
   *
   * @param   object $block The block element.
   * @return  void
   */
  let initializeBlock = function ($block) {
    try {
      let post_slider_container = $block.querySelector(
        ".lci-post-slider-container"
      );
      post_slider_container.classList.remove("is-hidden");

      let slider_columns = post_slider_container.querySelectorAll(".is-hidden");
      [...slider_columns].forEach((slider_column) => {
        slider_column.classList.remove("is-hidden");
      });

      // trigger redraw for transition
      post_slider_container.offsetHeight;

      if (post_slider_container) {
        let options = {
          // initialIndex: 1,
          imagesLoaded: true, // re-positions cells once their images have loaded
          groupCells: true, // group cells that fit in carousel viewport
          cellAlign: "center", // left, right, center
          freeScroll: false, // enables content to be freely scrolled and flicked without aligning cells to an end position
          wrapAround: "true",
          watchCSS: true,
          // enable Flickity in CSS when
          // element:after { content: 'flickity' }
        };

        // console.log(options);

        let slider = new Flickity(post_slider_container, options);
      }
      // else {
      //   // slider empty or flickity-slider render template is missing div.post_slider_container
      // }
    } catch (e) {
      console.error(e, $block);
    }
  };

  // ACF Javascript API
  if (window.acf) {
    window.acf.addAction(
      // Initialize dynamic block preview (editor).
      // If namespace is other than “acf/” use the full block name in the callback, so: render_block_preview/type=namespace/lci-post-slider
      "render_block_preview/type=lci-post-slider",
      ($block) => {
        // console.log("render event!");

        // Trigger editor preview refresh on block's props update
        initializeBlock($block[0]);

        // Trigger flickity refresh on block's props update
        window.dispatchEvent(new Event("resize"));
      }
    );
  }
})();
