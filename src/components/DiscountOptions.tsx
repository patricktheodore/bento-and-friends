import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

const DiscountOptionsComponent: React.FC = () => {
	const discountOptions = [
		{ lunches: 2, discount: 5, description: 'Perfect for a couple of days' },
		{ lunches: '3-4', discount: 10, description: 'Great for most of the week' },
		{ lunches: '5+', discount: 20, description: 'Best value for the full week' },
	];

	return (
		<div className="w-full bg-brand-cream py-12 px-4 md:px-8 mb-8">
			<div className="max-w-screen-xl mx-auto flex flex-col gap-8">
				<h2 className="text-4xl text-primary">Save More, Eat Better</h2>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{discountOptions.map((option, index) => (
						<div
							key={index}
							className="bg-white border-2 border-primary rounded-lg p-6"
						>
							<div className="flex items-center justify-between mb-4">
								<ShoppingBag
									size={32}
									className="text-primary"
								/>
								<div className="flex items-center">
									<span className="text-3xl font-bold text-primary">{option.discount}%</span>
								</div>
							</div>
							<h3 className="text-xl font-semibold text-primary mb-2">
								Order {option.lunches} Bento Boxes
							</h3>
							<p className="text-gray-600">{option.description}</p>
						</div>
					))}
				</div>

				<div className="text-center">
					<Link
						to="/order"
						className="inline-block bg-brand-dark-green text-brand-cream hover:brightness-110 font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:shadow-lg ring-2 ring-transparent hover:ring-brand-dark-green ring-offset-2 ring-offset-brand-cream"
					>
						Order Now &rarr;
					</Link>
				</div>
			</div>
		</div>
	);
};

export default DiscountOptionsComponent;
