<?php
/**
 * Plugin Name:     LCI Post Slider
 * Description:     Post Slider Block for Gutenberg made with ACF
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
define('LPS_PLUGIN_DIR_URI', untrailingslashit(plugin_dir_url(__FILE__)));
define('LPS_BLOCK_TEMPLATE_PATH', LPS_PLUGIN_DIR_PATH . '/block-templates/');


if (!class_exists('LCI_Post_Slider')) {
  /**
   * The plugin's main class
   *
   * @since 1.0
   */
  class LCI_Post_Slider
  {
    /**
     * Constructor function.
     */
    function __construct()
    {
      add_action('acf/init', [$this, 'register_blocks']);
      // add_filter('block_categories_all', [$this, 'add_block_categories']);

      add_action('after_setup_theme', [$this, 'load_text_domain']);

      add_action('wp_footer', [$this, 'activate_js_translations']);
    }


    public function register_blocks()
    {
      if (!function_exists('acf_register_block_type')) {
        return;
      }
      register_block_type(LPS_PLUGIN_DIR_PATH); // block.json path

      // TODO: test if we can use wp_is_block_theme() at that point or later to change asset loading behavior
      // because the following is useless in block themes if we use add_filter(should_load_separate_core_block_assets', '__return_true');
      if (is_admin()) {
        // Load assets only in Admin or when block need to be rendered (in render template -> /block-templates/render.php)
        // https://mkaz.blog/wordpress/conditionally-load-block-assets-part-2/
        require_once LPS_BLOCK_TEMPLATE_PATH . '/enqueue_assets.php';
      }
    }

    public function load_text_domain()
    {
      /*$loaded = */load_textdomain('lci-post-slider', LPS_PLUGIN_DIR_PATH . '/languages/lci-post-slider-' . get_locale() . '.mo');

      // echo '<pre>';
      // print_r($loaded ? 'true' : 'false');
      // echo '</pre>';
      // wp_die();
    }


    public function activate_js_translations()
    {
      $success = wp_set_script_translations(
        // enqueued script handle
        'lci-post-slider-script',
        // Block Text Domain
        'lci-post-slider',
        // Translation file path
        dirname(__FILE__) . '/languages'
      );
    }
  }
}

new LCI_Post_Slider();