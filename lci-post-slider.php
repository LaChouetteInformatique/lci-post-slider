<?php
/**
 * Plugin Name:     LCI Post Slider
 * Description:     Post Slider Block for Gutenberg made with ACF, Bootstrap and Flickity
 * Version:         1.0
 * Author:          La Chouette Informatique
 * Author URI:      https://lachouetteinformatique.fr
 * License:         GPL-2.0-or-later
 * License URI:     https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:     lci-post-slider
 *
 * @package         lci-post-slider
 */

// Exits if accessed directly.
if (!defined('ABSPATH')) {
  exit;
}

define('LPS_PLUGIN_DIR_PATH', untrailingslashit(plugin_dir_path(__FILE__)));
define('LPS_BLOCK_TEMPLATE_PATH', LPS_PLUGIN_DIR_PATH . '/block-templates');
define('LPS_BUILD_DIR_PATH', LPS_PLUGIN_DIR_PATH . '/build');
define('LPS_LIBRARY_DIR_PATH', LPS_PLUGIN_DIR_PATH . '/library');

define('LPS_PLUGIN_DIR_URI', untrailingslashit(plugin_dir_url(__FILE__)));
define('LPS_BUILD_DIR_URI', LPS_PLUGIN_DIR_URI . '/build');
define('LPS_LIBRARY_DIR_URI', LPS_PLUGIN_DIR_URI . '/library');


// Utils
require_once LPS_PLUGIN_DIR_PATH . '/inc/helpers/template-tags.php';

// Main plugin class
require_once LPS_PLUGIN_DIR_PATH . '/inc/classes/class-lci-post-slider.php';


new LCI_Post_Slider();