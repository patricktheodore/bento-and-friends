import React from 'react';
import { ShoppingBag, Percent } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const DiscountOptionsComponent: React.FC = () => {
	const discountOptions = [
		{ lunches: 2, discount: 5, description: 'Perfect for a couple of days' },
		{ lunches: '3-4', discount: 10, description: 'Great for most of the week' },
		{ lunches: '5+', discount: 20, description: 'Best value for the full week' },
	];

	return (
		<div className="w-full br-brand-cream py-16 px-4 sm:px-6">
			<div className="max-w-7xl mx-auto space-y-12">
				{/* Header */}
				<div className="text-center space-y-4">
					<h2 className="text-4xl md:text-5xl font-bold text-gray-900">
						Save More, Eat Better
					</h2>
					<p className="text-lg text-gray-600 max-w-2xl mx-auto">
						Order multiple meals and enjoy increasing discounts that make healthy eating more affordable.
					</p>
				</div>

				{/* Discount Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{discountOptions.map((option, index) => (
						<Card 
							key={index} 
							className={`text-center hover:shadow-lg transition-all duration-300 ${
								index === 2 ? 'ring-2 ring-blue-500 shadow-lg' : ''
							}`}
						>
							<CardHeader className="pb-4">
								<div className="flex items-center justify-between mb-4">
									<div className="p-3 bg-green-100 rounded-lg">
										<ShoppingBag className="h-6 w-6 text-green-600" />
									</div>
									<Badge 
										variant="secondary" 
										className="bg-green-100 text-green-800 text-lg font-bold px-3 py-1"
									>
										<Percent className="h-4 w-4 mr-1" />
										{option.discount}% OFF
									</Badge>
								</div>
								<CardTitle className="text-xl font-semibold text-gray-900">
									Order {option.lunches} Bento Boxes
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-gray-600">{option.description}</p>
								{index === 2 && (
									<Badge className="mt-3 bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors">
										Best Value
									</Badge>
								)}
							</CardContent>
						</Card>
					))}
				</div>

				{/* CTA */}
				<div className="text-center">
					<Button asChild size="lg" className="px-8 py-3 rounded-full">
						<Link to="/order">
							Start Saving →
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
};

export default DiscountOptionsComponent;