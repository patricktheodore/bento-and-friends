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
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const HomePage: React.FC = () => {
	const { state } = useAppContext();
	const [heroImage, setHeroImage] = useState(placeholder);
	const [imageLoading, setImageLoading] = useState(true);

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
			} finally {
				setImageLoading(false);
			}
		};

		fetchHeroImage();
	}, []);

	return (
		<div className="w-full">
			{/* Hero Section */}
			<div className="relative h-[60vh] min-h-[500px] flex items-center justify-center">
				{imageLoading && (
					<div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-20">
						<Loader2 className="h-8 w-8 animate-spin text-gray-600" />
					</div>
				)}
				<div
					className="absolute inset-0 bg-cover bg-center z-0"
					style={{
						backgroundImage: `url(${heroImage})`,
					}}
				>
					<div className="absolute inset-0 bg-black/70"></div>
				</div>

				<div className="z-10 text-center px-4 max-w-4xl mx-auto">
					<h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
						Welcome to Bento & Friends!
					</h1>
					<h2 className="text-xl md:text-3xl text-white mb-4 font-medium">
						Perth's Dedicated School Lunch Catering Specialists
					</h2>
					<p className="text-lg md:text-xl text-white/90 mb-8 font-light italic">
						"Powering our school kids with every bite"
					</p>
					
					{state.user ? (
						<Button 
							asChild 
							size="lg" 
							className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
						>
							<Link to="/order">
								Order Now
							</Link>
						</Button>
					) : (
						<div className="flex flex-col sm:flex-row justify-center gap-4">
							<Button 
								asChild 
								variant="outline" 
								size="lg"
								className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-gray-900 font-semibold px-8 py-3 rounded-full transition-all duration-300"
							>
								<Link to="/signin?mode=register">
									Get Started
								</Link>
							</Button>
							<Button 
								asChild 
								size="lg"
								className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
							>
								<Link to="/signin">
									Sign In
								</Link>
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* Content Sections */}
			<div className="space-y-0">
				<HowItWorksSummaryComponent />
				<DiscountOptionsComponent />
				<NutritionComponent />
				<CateringPreviewComponent />
				<OurStoryComponent />
				<FeaturedMenuItemsCarousel />
			</div>
		</div>
	);
};

export default HomePage;