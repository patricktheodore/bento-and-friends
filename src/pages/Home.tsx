import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FeaturedMenuItemsCarousel from '../components/FeaturedMenuItemsCarousel';
import HowItWorksSummaryComponent from '../components/HowItWorksSummary';
import NutritionComponent from '../components/Nutrition';
import OurStoryComponent from '../components/OurStory';
import { useAppContext } from '../context/AppContext';
import DiscountOptionsComponent from '@/components/DiscountOptions';
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import placeholder from '@/assets/banner.png';
import CateringPreviewComponent from '@/components/CateringPreview';

const HomePage: React.FC = () => {
	const { state } = useAppContext();

	const [heroImage, setHeroImage] = useState(placeholder);

	useEffect(() => {
	  const fetchHeroImage = async () => {
		const storage = getStorage();
		const heroImageRef = ref(storage, 'images/hero.jpg');
		try {
		  const url = await getDownloadURL(heroImageRef);
		  setHeroImage(url);
		} catch (error) {
		  console.error("Error fetching hero image:", error);
		  setHeroImage(placeholder);
		}
	  };
  
	  fetchHeroImage();
	}, []);

	return (
		<>
			<div className="relative max-h-screen h-[40vh] flex items-center justify-center">
				<div
					className="absolute inset-0 bg-cover bg-center z-0"
					style={{
						backgroundImage: `url(${heroImage})`,
					}}
				>
					<div className="absolute inset-0 bg-black opacity-75"></div>
				</div>

				<div className="z-10 text-center px-4">
					<h1 className="text-4xl md:text-6xl tracking-wide text-brand-cream mb-4">Welcome to Bento & Friends!</h1>
					<h2 className='text-2xl md:text-4xl text-brand-cream mb-4'>Perth’s Dedicated School Lunch Catering Specialists</h2>
					<h3 className='text-xl md:text-2xl text-brand-cream mb-8 font-light italic'>"Powering our school kids with every bite"</h3>
					{state.user ? (
						<Link
							to="/order"
							className="bg-brand-cream text-brand-dark-green hover:brightness-75 font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg ring-2 ring-transparent hover:ring-brand-dark-green"
						>
							Order Now
						</Link>
					) : (
						<div className="flex justify-center gap-4">
							<Link
								to="/signin?mode=register"
								className="bg-transparent text-brand-cream border-2 border-cream hover:brightness-75 font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg ring-2 ring-transparent hover:ring-brand-dark-green"
							>
								Get Started
							</Link>
							<Link
								to="/signin"
								className="bg-brand-cream text-brand-dark-green hover:brightness-75 font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg ring-2 ring-transparent hover:ring-brand-dark-green"
							>
								Sign In
							</Link>
						</div>
					)}
				</div>
			</div>
			<HowItWorksSummaryComponent />
			<DiscountOptionsComponent />
			<NutritionComponent />
			<CateringPreviewComponent />
			<OurStoryComponent />
            <FeaturedMenuItemsCarousel />
			{/* <TestimonialsComponent /> */}
			{/* <SustainabilityComponent /> */}
		</>
	);
};

export default HomePage;
