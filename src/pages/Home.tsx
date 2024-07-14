import React from 'react';
import { Link } from 'react-router-dom';
import FeaturedMenuItemsCarousel from '../components/FeaturedMenuItemsCarousel';

const HomePage: React.FC = () => {
	return (
		<>
			<div className="relative max-h-screen h-[75vh] flex items-center justify-center">
				{/* Background Image */}
				<div
					className="absolute inset-0 bg-cover bg-center z-0"
					style={{
						backgroundImage: "url('src/assets/image-01.webp')",
						// Ensure this path is correct for your project structure
					}}
				>
					{/* Overlay for better text visibility */}
					<div className="absolute inset-0 bg-black opacity-50"></div>
				</div>

				{/* Content */}
				<div className="z-10 text-center px-4">
					<h1 className="text-4xl md:text-6xl tracking-wide text-brand-cream mb-8">Welcome to Bento & Friends!</h1>
					<Link
						to="/order"
						className="bg-brand-cream text-brand-dark-green hover:brightness-75 font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg ring-2 ring-transparent hover:ring-brand-dark-green"
					>
						Order Now
					</Link>
				</div>
			</div>
            <FeaturedMenuItemsCarousel />
		</>
	);
};

export default HomePage;