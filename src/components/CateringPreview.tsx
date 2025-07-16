import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChefHat } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

const CateringPreviewComponent: React.FC = () => {
	const { state } = useAppContext();

	return (
		<div className="w-full bg-brand-cream py-16 px-4 sm:px-6">
			<div className="max-w-7xl mx-auto space-y-12">
				{/* Header */}
				<div className="text-center space-y-4">
					<h2 className="text-4xl md:text-5xl font-bold text-gray-900">
						Catering Services
					</h2>
					<p className="text-xl text-gray-600 max-w-3xl mx-auto">
						From school events to corporate functions, we provide fresh, delicious catering solutions tailored to your needs.
					</p>
				</div>

				{/* Platters Grid */}
				{state.platters.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						{state.platters.slice(0, 3).map((platter, index) => (
							<Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
								<div className="h-48 overflow-hidden bg-gray-200">
									<img
										src={platter.image}
										alt={platter.display}
										className="w-full h-full object-cover"
										onError={(e) => {
											const target = e.target as HTMLImageElement;
											target.style.display = 'none';
											target.parentElement!.classList.add('flex', 'items-center', 'justify-center');
											target.parentElement!.innerHTML = '<div class="p-2 bg-gray-300 rounded-lg"><svg class="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" /></svg></div>';
										}}
									/>
								</div>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<ChefHat className="h-5 w-5" />
										{platter.display}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-gray-600">{platter.description}</p>
								</CardContent>
							</Card>
						))}
					</div>
				) : (
					<Card>
						<CardContent className="text-center py-12">
							<div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
								<ChefHat className="h-8 w-8 text-gray-400" />
							</div>
							<h3 className="text-lg font-medium text-gray-900 mb-2">Catering Options Coming Soon</h3>
							<p className="text-gray-500">
								We're preparing amazing catering options for your events. Check back soon!
							</p>
						</CardContent>
					</Card>
				)}

				{/* CTA */}
				<div className="text-center">
					<Button asChild size="lg" className="px-8 py-3 rounded-full">
						<Link to="/catering" className="flex items-center gap-2">
							Explore Our Catering Options
							<ArrowRight className="h-5 w-5" />
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
};

export default CateringPreviewComponent;