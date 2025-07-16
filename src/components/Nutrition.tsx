import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Shield, Award } from 'lucide-react';

const NutritionComponent: React.FC = () => {
	const highlights = [
		{
			icon: Shield,
			title: 'Nut Free',
			description: 'Complete nut-free environment for safety',
		},
		{
			icon: Award,
			title: '90% Green Rated',
			description: 'Meets WASFDC traffic light system standards',
		},
		{
			icon: Heart,
			title: 'HFD Compliant',
			description: 'Adheres to Healthy Food & Drink criteria',
		},
	];

	return (
		<div className="w-full bg-brand-dark-green text-brand-cream py-16 px-4 sm:px-6">
			<div className="max-w-7xl mx-auto space-y-12">
				{/* Header */}
				<div className="text-center space-y-4">
					<h2 className="text-4xl md:text-5xl font-bold">
						Nutrition First
					</h2>
					<p className="text-xl text-green-100 max-w-3xl mx-auto">
						Every meal is carefully crafted to provide optimal nourishment while meeting the highest safety and quality standards.
					</p>
				</div>

				{/* Highlights */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
					{highlights.map((highlight, index) => {
						const Icon = highlight.icon;
						return (
							<Card key={index} className="bg-white/10 border-white/20 text-white">
								<CardContent className="text-center pt-6">
									<div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
										<Icon className="h-6 w-6" />
									</div>
									<h3 className="text-lg font-semibold mb-2">{highlight.title}</h3>
									<p className="text-green-100 text-sm">{highlight.description}</p>
								</CardContent>
							</Card>
						);
					})}
				</div>

				{/* Content */}
				<div className="max-w-4xl mx-auto space-y-6 text-center">
					<p className="text-lg text-green-100">
						At Bento & Friends, we believe that proper nutrition is crucial for growing minds and
						bodies. Our meals are carefully crafted to provide optimal nourishment while catering to
						various dietary needs and preferences.
					</p>
					<p className="text-lg text-green-100">
						Every bento box is a balanced meal, designed to fuel your child's day with the right mix of
						proteins, carbohydrates, and essential nutrients. We prioritize food safety, health hygiene,
						and allergen awareness in all our preparations.
					</p>
					<p className="text-lg text-green-100">
						With a school focused menu that is completely nut free, 90% of our menu is classified GREEN under the school
						traffic light system (WASFDC) and adhered under the HFD criteria. Our meals are cooked fresh in our commercial
						kitchen by a qualified and school allergen aware team, then delivered straight to your school on time ready for hungry
						school kids to fuel their day!
					</p>
				</div>

				{/* CTA */}
				<div className="text-center">
					<Button 
						asChild 
						variant="secondary" 
						size="lg" 
						className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-3 rounded-full"
					>
						<Link to="/menu">
							Explore Our Menu →
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
};

export default NutritionComponent;
