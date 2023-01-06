<?php
/**
 * - Styles and Scripts declared here will be enqueued only if the block is rendered
 * - activate javascript translations
 * 
 *  This file is useless in block themes
 *  This file must be required from in block render template and in admin area
 * 
 * @package lci-post-slider
 */

if (!defined('ABSPATH')) {
  exit; // Exit if accessed directly.
}

// Styles
if (!wp_script_is("bootstrap-css")) {
  wp_enqueue_style('bootstrap-css', LPS_PLUGIN_DIR_URI . '/library/bootstrap.min.css');
}
wp_enqueue_style('flickity', LPS_PLUGIN_DIR_URI . '/library/flickity.min.css');
wp_enqueue_style('lci-post-slider-style', LPS_PLUGIN_DIR_URI . '/build/style.css', ['bootstrap-css'], filemtime(LPS_PLUGIN_DIR_PATH . '/build/style.css'));

// Scripts
// if (!wp_script_is("bootstrap-js")) {
//   wp_enqueue_script('bootstrap-js', LCI_BUILD_LIB_URI . '/js/bootstrap.min.js', [], false, true);
// }
wp_enqueue_script('flickity', LPS_PLUGIN_DIR_URI . '/library/flickity.pkgd.min.js', [], '2.2.1', true);
wp_enqueue_script('lci-post-slider-script', LPS_PLUGIN_DIR_URI . '/build/index.js', ['flickity', 'wp-i18n', 'acf'], '1.0.0', true);