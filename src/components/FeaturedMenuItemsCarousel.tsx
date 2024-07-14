import React from 'react';
import Slider from 'react-slick';
import MenuItemCard, { MenuItemProps } from './MenuItemCard';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Link } from 'react-router-dom';


const FeaturedMenuItemsCarousel: React.FC = () => {
	const featuredItems = [
		{
			image: 'src/assets/image-01.webp',
			title: 'Teriyaki Chicken Bento',
			description:
				'Grilled chicken with our special teriyaki sauce, served with steamed rice and seasonal vegetables.',
			price: 12.99,
		},
		{
			image: 'src/assets/image-02.webp',
			title: 'Vegetarian Sushi Roll',
			description: 'Assorted fresh vegetables wrapped in sushi rice and nori, served with wasabi and soy sauce.',
			price: 9.99,
		},
		{
			image: 'src/assets/image-01.webp',
			title: 'Teriyaki Chicken Bento',
			description:
				'Grilled chicken with our special teriyaki sauce, served with steamed rice and seasonal vegetables.',
			price: 12.99,
		},
		{
			image: 'src/assets/image-02.webp',
			title: 'Vegetarian Sushi Roll',
			description: 'Assorted fresh vegetables wrapped in sushi rice and nori, served with wasabi and soy sauce.',
			price: 9.99,
		},
		{
			image: 'src/assets/image-01.webp',
			title: 'Teriyaki Chicken Bento',
			description:
				'Grilled chicken with our special teriyaki sauce, served with steamed rice and seasonal vegetables.',
			price: 12.99,
		},
		{
			image: 'src/assets/image-02.webp',
			title: 'Vegetarian Sushi Roll',
			description: 'Assorted fresh vegetables wrapped in sushi rice and nori, served with wasabi and soy sauce.',
			price: 9.99,
		},
		{
			image: 'src/assets/image-01.webp',
			title: 'Teriyaki Chicken Bento',
			description:
				'Grilled chicken with our special teriyaki sauce, served with steamed rice and seasonal vegetables.',
			price: 12.99,
		},
		{
			image: 'src/assets/image-02.webp',
			title: 'Vegetarian Sushi Roll',
			description: 'Assorted fresh vegetables wrapped in sushi rice and nori, served with wasabi and soy sauce.',
			price: 9.99,
		},
		// Add more items as needed
	];

	const settings = {
		dots: true,
		infinite: false,
		speed: 500,
		slidesToShow: 4,
		slidesToScroll: 4,
		initialSlide: 0,
    showArrows: false,
		responsive: [
			{
				breakpoint: 1024,
				settings: {
					slidesToShow: 3,
					slidesToScroll: 3,
					infinite: true,
					dots: true,
				},
			},
			{
				breakpoint: 600,
				settings: {
					slidesToShow: 2,
					slidesToScroll: 2,
					initialSlide: 2,
				},
			},
			{
				breakpoint: 480,
				settings: {
					slidesToShow: 1,
					slidesToScroll: 1,
				},
			},
		],
	};

	return (
		<div className="w-full max-w-screen-xl mx-auto p-4">
			<div className="flex flex-col md:flex-row items-start justify-start md:justify-between md:items-center px-4 mb-4 gap-y-2">
				<h2 className="text-2xl md:text-3xl text-primary">Featured Menu Items</h2>
				<Link
					to={'/menu'}
					className="text-primary underline text-lg font-light tracking-wide hover:cursor-pointer hover:text-secondary underline-offset-[6px] hover:underline-offset-8 transition-all duration-300"
				>
					See All
				</Link>
			</div>
			<Slider {...settings}>
				{featuredItems.map((item, index) => (
					<div
						key={index}
						className="px-2"
					>
						<MenuItemCard {...item} />
					</div>
				))}
			</Slider>
		</div>
	);
};

export default FeaturedMenuItemsCarousel;
