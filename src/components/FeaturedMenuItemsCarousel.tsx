import React, { useRef } from 'react';
import Slider from 'react-slick';
import MenuItemCard from './MenuItemCard';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/16/solid';
import { useAppContext } from '@/context/AppContext';

const FeaturedMenuItemsCarousel: React.FC = () => {
	const sliderRef = useRef<Slider>(null);
	const {state } = useAppContext();

	const featuredItems = state.mains.filter((item) => item.isFeatured);
	
	const goToNextSlide = () => {
		if (sliderRef.current) {
			sliderRef.current.slickNext();
		}
	};

	const handleOrderNow = (id: string) => {
		console.log('Order Now:', id);
	}

	const goToPrevSlide = () => {
		if (sliderRef.current) {
			sliderRef.current.slickPrev();
		}
	};

	const settings = {
		customPaging: function () {
			return (
				<div className="mx-1 w-fit h-fit flex justify-center">
					<div className="w-2 h-2 bg-slate-300 hover:bg-brand-dark-green rounded-full transition-all duration-300 ease-in-out" />
				</div>
			);
		},
		dots: true,
		dotsClass: 'slick-dots custom-dot-class',
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
		<div className="w-full mx-auto p-4 pb-12 mt-8">
			<div className="flex flex-row items-start justify-between md:items-center px-2 md:px-12 mb-4 gap-y-2">
				<h2 className="text-4xl text-primary">Featured Items</h2>
				<Link
					to={'/menu'}
					className="text-primary underline text-lg font-light tracking-wide hover:cursor-pointer hover:text-secondary underline-offset-[6px] hover:underline-offset-8 transition-all duration-300"
				>
					See All
				</Link>
			</div>
			<div className="relative px-8">
				<div className="absolute top-1/2 left-0 transform -translate-y-1/2 hover:brightness-75 hover:cursor-pointer hover:scale-y-125 transition-all duration-200 ease-in-out">
					<button onClick={goToPrevSlide}>
						<ChevronLeftIcon className="w-8 h-8 text-brand-dark-green" />
					</button>
				</div>
				<Slider
					ref={sliderRef}
					{...settings}
				>
					{featuredItems.map((item, index) => (
						<div
							key={index}
							className="px-2"
						>
							<MenuItemCard
								key={item.id}
								image={item.image}
								title={item.display}
								allergens={item.allergens}
								description={item.description}
								isVegetarian={item.isVegetarian}
								onOrderNow={() => handleOrderNow(item.id)}
							/>
						</div>
					))}
				</Slider>
				<div className="absolute top-1/2 right-0 transform -translate-y-1/2 hover:brightness-75 hover:cursor-pointer hover:scale-y-125 transition-all duration-200 ease-in-out">
					<button onClick={goToNextSlide}>
						<ChevronRightIcon className="w-8 h-8 text-brand-dark-green" />
					</button>
				</div>
			</div>
		</div>
	);
};

export default FeaturedMenuItemsCarousel;
