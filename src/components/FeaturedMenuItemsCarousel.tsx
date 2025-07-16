import React, { useRef, useState } from 'react';
import Slider from 'react-slick';
import MenuItemCard from './MenuItemCard';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const FeaturedMenuItemsCarousel: React.FC = () => {
	const sliderRef = useRef<Slider>(null);
	const { state } = useAppContext();
	const [canGoPrev, setCanGoPrev] = useState(false);
	const [canGoNext, setCanGoNext] = useState(true);

	const featuredItems = state.mains.filter((item) => item.isFeatured);

	const goToNextSlide = () => {
		if (sliderRef.current) {
			sliderRef.current.slickNext();
		}
	};

	const handleOrderNow = (id: string) => {
		console.log('Order Now:', id);
	};

	const goToPrevSlide = () => {
		if (sliderRef.current) {
			sliderRef.current.slickPrev();
		}
	};

	const settings = {
		dots: true,
		dotsClass: 'slick-dots !flex !justify-center !gap-2 !mt-8',
		infinite: featuredItems.length > 4, // Only infinite if we have more than 4 items
		speed: 500,
		slidesToShow: 4,
		slidesToScroll: 1,
		initialSlide: 0,
		arrows: false,
		autoplay: featuredItems.length > 4, // Only autoplay if we have enough items
		autoplaySpeed: 4000,
		beforeChange: (current: number, next: number) => {
			// Update navigation button states
			const totalSlides = featuredItems.length;
			const slidesToShow = window.innerWidth >= 1024 ? 4 : window.innerWidth >= 600 ? 2 : 1;
			
			setCanGoPrev(next > 0 || settings.infinite);
			setCanGoNext(next < totalSlides - slidesToShow || settings.infinite);
		},
		responsive: [
			{
				breakpoint: 1280,
				settings: {
					slidesToShow: 3,
					slidesToScroll: 1,
				},
			},
			{
				breakpoint: 768,
				settings: {
					slidesToShow: 2,
					slidesToScroll: 1,
				},
			},
			{
				breakpoint: 640,
				settings: {
					slidesToShow: 1,
					slidesToScroll: 1,
					centerMode: true,
					centerPadding: '40px',
				},
			},
		],
	};

	if (featuredItems.length === 0) {
		return (
			<div className="w-full bg-brand-cream py-16 lg:py-24 px-4 sm:px-6">
				<div className="max-w-7xl mx-auto">
					<Card className="shadow-lg">
						<CardContent className="text-center py-12">
							<div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
								<Star className="h-8 w-8 text-gray-400" />
							</div>
							<h3 className="text-lg font-medium text-gray-900 mb-2">Featured Items Coming Soon</h3>
							<p className="text-gray-500 mb-6">
								We're preparing some amazing featured menu items for you. Check back soon!
							</p>
							<Button asChild>
								<Link to="/menu">View Full Menu</Link>
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	// If we have 4 or fewer items, show them in a simple grid instead of carousel
	if (featuredItems.length <= 4) {
		return (
			<div className="w-full bg-brand-cream py-16 lg:py-24 px-4 sm:px-6">
				<div className="max-w-7xl mx-auto space-y-12">
					{/* Header */}
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
						<div className="space-y-2">
							<h2 className="text-4xl md:text-5xl font-bold text-gray-900">Featured Items</h2>
							<p className="text-gray-600">
								Discover our most popular and chef-recommended menu items
							</p>
						</div>
						<div className="flex items-center gap-2">
							<Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
								<Star className="h-3 w-3 mr-1" />
								Featured
							</Badge>
							<Button asChild variant="outline">
								<Link to="/menu">
									See All Items
								</Link>
							</Button>
						</div>
					</div>

					{/* Grid Layout */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{featuredItems.map((item) => (
							<MenuItemCard
								key={item.id}
								item={item}
								onOrderNow={() => handleOrderNow(item.id)}
							/>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full bg-brand-cream py-16 lg:py-24 px-4 sm:px-6">
			<div className="max-w-7xl mx-auto space-y-12">
				{/* Header */}
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div className="space-y-2">
						<h2 className="text-4xl md:text-5xl font-bold text-gray-900">Featured Items</h2>
						<p className="text-gray-600">
							Discover our most popular and chef-recommended menu items
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
							<Star className="h-3 w-3 mr-1" />
							Featured
						</Badge>
						<Button asChild variant="outline">
							<Link to="/menu">
								See All Items
							</Link>
						</Button>
					</div>
				</div>

				{/* Mobile Instructions */}
				<div className="block sm:hidden text-center mb-4">
					<p className="text-sm text-gray-500">Swipe to see more items</p>
				</div>

				{/* Carousel */}
				<div className="relative">
					{/* Desktop Navigation Buttons */}
					<Button
						variant="outline"
						size="icon"
						className={`hidden md:flex p-0 absolute top-1/2 left-2 transform -translate-y-1/2 z-10 bg-white shadow-lg hover:shadow-xl border-2 transition-all duration-200 ${
							canGoPrev 
								? 'hover:bg-gray-50 border-gray-300' 
								: 'opacity-50 cursor-not-allowed border-gray-200'
						}`}
						onClick={goToPrevSlide}
						disabled={!canGoPrev}
					>
						<ChevronLeft className="h-5 w-5 text-gray-700" />
					</Button>
					
					<div className="mx-0 md:mx-12">
						<Slider ref={sliderRef} {...settings}>
							{featuredItems.map((item) => (
								<div key={item.id} className="px-2">
									<MenuItemCard
										item={item}
										onOrderNow={() => handleOrderNow(item.id)}
									/>
								</div>
							))}
						</Slider>
					</div>
					
					<Button
						variant="outline"
						size="icon"
						className={`hidden md:flex p-0 absolute top-1/2 right-2 transform -translate-y-1/2 z-10 bg-white shadow-lg hover:shadow-xl border-2 transition-all duration-200 ${
							canGoNext 
								? 'hover:bg-gray-50 border-gray-300' 
								: 'opacity-50 cursor-not-allowed border-gray-200'
						}`}
						onClick={goToNextSlide}
						disabled={!canGoNext}
					>
						<ChevronRight className="h-5 w-5 text-gray-700" />
					</Button>
				</div>

				{/* Mobile Navigation Buttons */}
				<div className="flex md:hidden justify-center gap-4 mt-6">
					<Button
						variant="outline"
						size="sm"
						className={`px-2 transition-all duration-200 text-gray-700 border-gray-300 ${
							canGoPrev 
								? 'hover:bg-gray-50 hover:text-gray-900' 
								: 'opacity-50 cursor-not-allowed'
						}`}
						onClick={goToPrevSlide}
						disabled={!canGoPrev}
					>
						<ChevronLeft className="h-4 w-4 mr-2 text-gray-700" />
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						className={`px-2 transition-all duration-200 text-gray-700 border-gray-300 ${
							canGoNext 
								? 'hover:bg-gray-50 hover:text-gray-900' 
								: 'opacity-50 cursor-not-allowed'
						}`}
						onClick={goToNextSlide}
						disabled={!canGoNext}
					>
						Next
						<ChevronRight className="h-4 w-4 ml-2 text-gray-700" />
					</Button>
				</div>

				{/* Item Counter */}
				<div className="text-center">
					<p className="text-sm text-gray-500">
						Showing {featuredItems.length} featured item{featuredItems.length !== 1 ? 's' : ''}
					</p>
				</div>
			</div>
		</div>
	);
};

export default FeaturedMenuItemsCarousel;