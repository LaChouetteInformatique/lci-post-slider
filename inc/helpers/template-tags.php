<?php
/**
 * Custom template tags for the theme.
 *
 * @package lci-post-slider
 */

namespace LCI_POST_SLIDER\Helpers;

/**
 * Gets the thumbnail with Lazy Load.
 * Should be called in the WordPress Loop.
 *
 * @deprecated WordPress 5.5 natively include lazyload under certain circonstances
 * https://make.wordpress.org/core/2020/07/14/lazy-loading-images-in-5-5/
 *
 * @param int|null $post_id               Post ID.
 * @param string   $size                  The registered image size.
 * @param array    $additional_attributes Additional attributes. see https://developer.wordpress.org/reference/functions/wp_get_attachment_image/
 *
 * @return string
 * 
 */
function get_the_post_custom_thumbnail($post_id, $size = 'featured-thumbnail', $additional_attributes = [])
{
  $custom_thumbnail = '';

  if (null === $post_id) {
    $post_id = get_the_ID();
  }

  if (has_post_thumbnail($post_id)) {
    $default_attributes = [
      'loading' => 'lazy'
    ];

    $attributes = array_merge($additional_attributes, $default_attributes);

    $custom_thumbnail = wp_get_attachment_image(
      get_post_thumbnail_id($post_id),
      $size,
      false,
      $attributes
    );
  }

  return $custom_thumbnail;
}

/**
 * Renders Custom Thumbnail with Lazy Load.
 *
 * @param int    $post_id               Post ID.
 * @param string $size                  The registered image size.
 * @param array  $additional_attributes Additional attributes.
 */
function the_post_custom_thumbnail($post_id, $size = 'featured-thumbnail', $additional_attributes = [])
{
  echo get_the_post_custom_thumbnail($post_id, $size, $additional_attributes);
}

/**
 * Get the trimmed version of post excerpt.
 *
 * This is for modifing manually entered excerpts,
 * NOT automatic ones WordPress will grab from the content.
 *
 * It will display the first given characters ( e.g. 100 ) characters of a manually entered excerpt,
 * but instead of ending on the nth( e.g. 100th ) character,
 * it will truncate after the closest word.
 *
 * @param int $trim_character_count Charter count to be trimmed
 *
 * @return void
 */
function lci_the_excerpt($trim_character_count = 0)
{
  $post_ID = get_the_ID();

  if (empty($post_ID)) {
    return;
  }

  if (has_excerpt() || 0 === $trim_character_count) {

    the_excerpt();

  } else {
    echo wp_html_excerpt(get_the_excerpt($post_ID), $trim_character_count, '[...]');
  }
}



/**
 * Echo an anchor tag if we are on frontend, or a div if we are in the editor
 * @param mixed $html_content
 * @param mixed $attributes
 * @return void
 */
function frontend_link($html_content, $attributes = [])
{

  // EDITOR
  if (is_admin()) {
    $html = "<div ";

    // remove href from the attributes
    if (array_key_exists('href', $attributes)) {
      unset($attributes['href']);
    }

  } else {
    $html = "<a ";

    // Set default href if not already set
    if (empty($attributes['href'])) {
      $attributes['href'] = '#';
    }
  }

  // escape every attributes
  $attributes = array_map('\esc_attr', $attributes);

  foreach ($attributes as $name => $value) {
    $html .= " $name=" . '"' . $value . '"';
  }

  // escape content
  $html .= '>' . wp_kses_post($html_content);

  // close tag
  $html .= '</' . (is_admin() ? "div" : "a") . '>';

  echo $html;
}