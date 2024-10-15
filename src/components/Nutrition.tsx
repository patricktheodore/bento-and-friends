import React from 'react';
import { Link } from 'react-router-dom';

const NutritionComponent: React.FC = () => {

	return (
		<div className="w-full bg-brand-dark-green text-white py-12 lg:py-24 px-4 md:px-8">
			<div className="max-w-screen-lg mx-auto flex flex-col gap-8 lg:gap-16">
				<h2 className="text-5xl md:text-6xl font-bold leading-tight">Nutrition First</h2>

				<div className="flex flex-col justify-center items-center gap-4">
						<p className="text-lg text-white text-opacity-90 text-justify">
							At Bento & Friends, we believe that proper nutrition is crucial for growing minds and
							bodies. Our meals are carefully crafted to provide optimal nourishment while catering to
							various dietary needs and preferences.
						</p>
						<p className="text-lg text-white text-opacity-90 text-justify">
							Every bento box is a balanced meal, designed to fuel your child's day with the right mix of
							proteins, carbohydrates, and essential nutrients. We prioritize food safety, health hygiene,
							and allergen awareness in all our preparations.
						</p>
						<p className="text-lg text-white text-opacity-90 text-justify">
						With a school focused menu that is completely nut free, 90% of our menu is classified GREEN under the school
traffic light system (WASFDC) and adhered under the HFD criteria. Our meals are cooked fresh in our commercial
kitchen by a qualified and school allergen aware team, then delivered straight to your school on time ready for hungry
school kids to fuel their day!
						</p>

					
				</div>

				<div className="text-center">
					<Link
						to="/menu"
						className="inline-block bg-brand-cream text-brand-dark-green hover:brightness-110 font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:shadow-lg ring-2 ring-transparent hover:ring-brand-cream ring-offset-2 ring-offset-brand-dark-green"
					>
						Explore Our Menu &rarr;
					</Link>
				</div>
			</div>
		</div>
	);
};

export default NutritionComponent;
