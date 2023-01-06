<?php
/**
 * Main plugin Class
 * 
 * @package lci-post-slider
 */


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

      add_action('after_setup_theme', [$this, 'add_image_size']);

      add_action('wp_head', function () {
        // enqueue css that need to be in the head to avoid Flash of Unstyles COntent
        wp_enqueue_style('lci-post-slider-header-style', LPS_BUILD_DIR_URI . '/header-style.css');
      });

      add_action('enqueue_block_editor_assets', function () {
        wp_enqueue_style('lci-post-slider-editor-style', LPS_BUILD_DIR_URI . '/gutenberg.css', [], filemtime(LPS_BUILD_DIR_PATH . '/gutenberg.css'), 'all');
      });

      // i18n -> No need for this plugin
      // add_action('after_setup_theme', [$this, 'load_text_domain']);
      // add_action('wp_footer', [$this, 'activate_js_translations']);
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


    public function add_image_size()
    {
      /**
       * Register image sizes.
       */
      \add_image_size('featured-thumbnail', 350, 233, true);
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