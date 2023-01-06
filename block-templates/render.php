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
// $images = get_field('images');
// $cellalign = get_field('cellalign'); // left, right or center
// $wraparound = get_field('wraparound'); // true/false

// $images_width = get_field('images_width');
// if (!$images_width['value'])
// 	$images_width['value'] = '25';
// if (!$images_width['unity'])
// 	$images_width['unity'] = 'vw';


/************************************
 * 
 *            POST LOOP
 * 
 ************************************/

$args = [
	'posts_per_page' => 3,
	'post_type' => 'post',
	//https://wordpress.stackexchange.com/questions/215871/explanation-of-update-post-meta-term-cache
	'update_post_meta_cache' => false,
	'update_post_term_cache' => false,
];

$post_query = new \WP_Query($args);

?>

<section id="<?php echo esc_attr($id); ?>" class="<?php echo esc_attr($className); ?>">

	<div class="lci-post-slider-container is-hidden row ">
		<?php


		if ($post_query->have_posts()) {
			while ($post_query->have_posts()) {
				$post_query->the_post();
				?>
				<div class="col-md-10 col-xl-4 is-hidden">
					<div class="card">

						<?php
						/* <a href="<?php echo esc_url(get_the_permalink()); ?>" class="img-card">*/
						ob_start();
						if (has_post_thumbnail()) {
							LCI_POST_SLIDER\Helpers\the_post_custom_thumbnail(
								get_the_ID(),
								'featured-thumbnail',
								[
									'sizes' => '(max-width: 420px) 420px, 233px',
									'class' => '',
								]
							);

						} else { ?>
							<img src="https://via.placeholder.com/510x340" class="" alt="Card image cap">
						<?php
						}

						$html_content = ob_get_contents();
						ob_end_clean();

						LCI_POST_SLIDER\Helpers\frontend_link(
							$html_content,
							[
								'href' => esc_url(get_the_permalink()),
								'class' => 'img-card'
							]
						);

						?>


						</a>
						<div class="card-content">
							<?php the_title('<h3 class="card-title">', '</h3>'); ?>
							<?php
							LCI_POST_SLIDER\Helpers\lci_the_excerpt(240);
							// the_excerpt();
							?>

						</div>
						<div class="card-read-more">
							<?php
							LCI_POST_SLIDER\Helpers\frontend_link(
								esc_html__('View More', 'lci-post-slider'),
								[
									'href' => esc_url(get_the_permalink()),
									'class' => 'btn btn-link btn-block'
								]
							);

							?>
						</div>
					</div>
				</div>


			<?php
			}

		} else {
			echo __('No images found. Add/select some by clicking on the "Add to gallery" button.', 'lci-post-slider');
		}
		wp_reset_postdata();
		echo '</div>';
		?>
</section>