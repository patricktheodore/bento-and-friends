import React from 'react';
import { ClipboardList, Utensils, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const HowItWorksSummaryComponent: React.FC = () => {
	const steps = [
		{
			icon: ClipboardList,
			title: 'Select Your Meals',
			description: 'Browse our menu and choose from a variety of nutritious options.',
		},
		{
			icon: Utensils,
			title: 'Customize Your Plan',
			description: 'Pick your preferred delivery day.',
		},
		{
			icon: Truck,
			title: 'We Deliver',
			description: "Sit back and relax as we deliver straight to your school.",
		},
	];

	return (
		<div className="w-full br-brand-cream py-16 px-4 sm:px-6">
			<div className="max-w-7xl mx-auto space-y-12">
				{/* Header */}
				<div className="text-center space-y-4">
					<h2 className="text-4xl md:text-5xl font-bold text-gray-900">
						How it Works
					</h2>
					<p className="text-lg text-gray-600 max-w-3xl mx-auto">
						Bento & Friends is designed to make a parent's life easier. Our streamlined menu and ordering
						process allow you to order with just a few clicks. Our weekly packages make it even simpler -
						order ahead and forget, confident that your child's nutritional needs are being taken care of.
					</p>
				</div>

				{/* Steps Grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{steps.map((step, index) => {
						const Icon = step.icon;
						return (
							<Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
								<CardHeader className="pb-4">
									<div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
										<Icon className="h-8 w-8 text-blue-600" />
									</div>
									<CardTitle className="text-xl font-semibold text-gray-900">
										{step.title}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-gray-600">{step.description}</p>
								</CardContent>
							</Card>
						);
					})}
				</div>

				{/* CTA */}
				<div className="text-center">
					<Button asChild size="lg" className="px-8 py-3 rounded-full">
						<Link to="/order">
							Order Now →
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
};

export default HowItWorksSummaryComponent;