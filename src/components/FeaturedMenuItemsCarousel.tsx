import React, { useRef } from 'react';
import Slider from 'react-slick';
import MenuItemCard from './MenuItemCard';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/16/solid';

const FeaturedMenuItemsCarousel: React.FC = () => {
  const sliderRef = useRef<Slider>(null);
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

  const goToNextSlide = () => {
    if (sliderRef.current) {
      sliderRef.current.slickNext();
    }
  };

  const goToPrevSlide = () => {
    if (sliderRef.current) {
      sliderRef.current.slickPrev();
    }
  };

	const settings = {
    customPaging: function(i: number) {
      return (
        <div className="mx-1 w-fit h-fit flex justify-center">
          <div className="w-2 h-2 bg-slate-300 hover:bg-brand-dark-green rounded-full transition-all duration-300 ease-in-out" />
        </div>
      );
    },
		dots: true,
    dotsClass: "slick-dots custom-dot-class",
		infinite: true,
		speed: 500,
		slidesToShow: 4,
		slidesToScroll: 4,
		initialSlide: 0,
    arrows: false,
		responsive: [
			{
				breakpoint: 1024,
				settings: {
					slidesToShow: 3,
					slidesToScroll: 3,
				},
			},
			{
				breakpoint: 600,
				settings: {
					slidesToShow: 2,
					slidesToScroll: 2,
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
		<div className="w-full max-w-screen-xl mx-auto p-4 pb-8">
			<div className="flex flex-col md:flex-row items-start justify-start md:justify-between md:items-center px-4 mb-4 gap-y-2">
				<h2 className="text-2xl md:text-3xl text-primary">Featured Menu Items</h2>
				<Link
					to={'/menu'}
					className="text-primary underline text-lg font-light tracking-wide hover:cursor-pointer hover:text-secondary underline-offset-[6px] hover:underline-offset-8 transition-all duration-300"
				>
					See All
				</Link>
			</div>
      <div className='relative px-8'>
        <div className='absolute top-1/2 left-0 transform -translate-y-1/2 hover:brightness-75 hover:cursor-pointer hover:scale-y-125 transition-all duration-200 ease-in-out'>
          <button onClick={goToPrevSlide}>
              <ChevronLeftIcon className='w-8 h-8 text-brand-dark-green' />
          </button>
        </div>
        <Slider ref={sliderRef} {...settings}>
          {featuredItems.map((item, index) => (
            <div
              key={index}
              className="px-2"
            >
              <MenuItemCard {...item} />
            </div>
          ))}
        </Slider>
        <div className='absolute top-1/2 right-0 transform -translate-y-1/2 hover:brightness-75 hover:cursor-pointer hover:scale-y-125 transition-all duration-200 ease-in-out'>
          <button onClick={goToNextSlide}>
              <ChevronRightIcon className='w-8 h-8 text-brand-dark-green' />
          </button>
        </div>

      </div>
		</div>
	);
};

export default FeaturedMenuItemsCarousel;
