<?php
/**
 * LCI Post Slider Block Template.
 * 
 * Text Domain: lci-post-slider
 * 
 * @param   array $block The block settings and attributes.
 * @param   string $content The block inner HTML (empty).
 * @param   bool $is_preview True during AJAX preview.
 * @param   int|string post_id The post ID this block is saved to.
 * 
 * @package lci-post-slider
 */

if (!defined('ABSPATH')) {
	exit; // Exit if accessed directly.
}

// Load assets only when block need to be rendered
// https://mkaz.blog/wordpress/conditionally-load-block-assets-part-2/
require_once dirname(__FILE__) . '/enqueue_assets.php';


/************************************
 * 
 *       ACF Gutenberg Config
 * 
 ************************************/

// Create id attribute allowing for custom "anchor" value.
$id = 'lci-post-slider-' . $block['id'];

if (!empty($block['anchor'])) {
	$id = $block['anchor'];
}

// Create class attribute allowing for custom "className" and "align" values.
$className = 'lci-post-slider';

if (!empty($block['className'])) {
	$className .= ' ' . $block['className'];
}
if (!empty($block['align'])) {
	$className .= ' align' . $block['align'];
}

// ACF Fields
$images = get_field('images');
$cellalign = get_field('cellalign'); // left, right or center
$wraparound = get_field('wraparound'); // true/false

$images_width = get_field('images_width');
if (!$images_width['value'])
	$images_width['value'] = '25';
if (!$images_width['unity'])
	$images_width['unity'] = 'vw';

$gap = get_field('gap');
if (!$gap['value'])
	$gap['value'] = '20';
if (!$gap['unity'])
	$gap['unity'] = 'px';

$size = 'slider_flickity_image'; // (thumbnail, medium, large, full or custom size)

?>

<section id="<?php echo esc_attr($id); ?>" class="<?php echo esc_attr($className); ?>">
	<?php

	printf(
		'<div class="lci-post-slider-container is-hidden" data-cellalign="%s" data-wraparound="%s">',
		esc_attr($cellalign),
		esc_attr($wraparound)
	);

	if ($images) {

		foreach ($images as $image) {
			printf(
				'<img src="%s" alt="%s" width="%s" height="500" ' . 'style="margin-right: %s; width: %s;">',
				// src
				esc_attr(wp_get_attachment_image_url($image['ID'], $size)),
				// alt
				esc_attr($image['alt']),
				// width
				esc_attr($images_width['value'] . $images_width['unity']),
				// gap
				esc_attr($gap['value'] . $gap['unity']),
				// width
				esc_attr($images_width['value'] . $images_width['unity']),
			);
		}
	} else {
		echo __('No images found. Add/select some by clicking on the "Add to gallery" button.', 'lci-post-slider');
	}
	echo '</div>';
	?>
</section>