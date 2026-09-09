import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Main } from '@/models/item.model';
import { schoolSlug } from '@/utils/utils';
import { Leaf } from 'lucide-react';

const SchoolMenuPage: React.FC = () => {
	const { schoolSlug: slug } = useParams<{ schoolSlug: string }>();
	const { state } = useAppContext();

	const school = state.schools.find((s) => schoolSlug(s.name) === slug);

	// Still loading schools from the initial fetch — show a spinner before deciding not-found.
	if (state.isLoading && state.schools.length === 0) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark-green mx-auto mb-4"></div>
					<p className="text-gray-600">Loading menu...</p>
				</div>
			</div>
		);
	}

	if (!school) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="text-center space-y-4">
					<h1 className="text-3xl font-bold text-brand-dark-green">School not found</h1>
					<p className="text-gray-600">We couldn't find a menu for this school.</p>
					<Link
						to="/schools"
						className="inline-flex items-center gap-2 bg-brand-dark-green text-brand-cream hover:bg-brand-dark-green/90 font-semibold py-3 px-8 rounded-full transition-all"
					>
						View all schools
					</Link>
				</div>
			</div>
		);
	}

	const schoolMains: Main[] = state.mains
		.filter((main) => main.isActive && !main.isTeachersOnly && school.menuItems?.includes(main.id))
		.sort((a, b) => {
			if (a.isFeatured && !b.isFeatured) return -1;
			if (!a.isFeatured && b.isFeatured) return 1;
			return a.display.localeCompare(b.display);
		});

	const renderMainItems = () => {
		if (schoolMains.length === 0) {
			return (
				<div className="text-center py-20 text-gray-600">
					No meals are currently available for {school.name}.
				</div>
			);
		}

		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				{schoolMains.map((item) => (
					<Card key={item.id} className="group overflow-hidden transition-all duration-300 border-gray-200 hover:border-brand-dark-green/20">
						<div className="relative overflow-hidden">
							<img
								src={item.image}
								alt={item.display}
								className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
							/>
							<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
								<p className="text-3xl font-bold text-white">${item.price.toFixed(2)}</p>
							</div>
						</div>
						<CardHeader className="pb-3">
							<CardTitle className="text-xl group-hover:text-brand-dark-green transition-colors">
								{item.display}
							</CardTitle>
							<CardDescription className="line-clamp-2 text-brand-taupe">
								{item.description}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex flex-wrap gap-2">
								{item.isNew && (
									<Badge variant="secondary" className="bg-brand-cream/20 text-brand-dark-green border-brand-dark-green/20">
										New
									</Badge>
								)}
								{item.isVegetarian && (
									<Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
										<Leaf className="h-3 w-3" />
										Vegetarian
									</Badge>
								)}
								{item.allergens?.map((allergen) => (
									<Badge key={allergen} variant="outline" className="uppercase text-xs">
										{allergen}
									</Badge>
								))}
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		);
	};

	const orderCta = state.user ? (
		<Link
			to="/order"
			className="inline-flex items-center gap-3 bg-brand-dark-green text-brand-cream hover:bg-brand-dark-green/90 font-bold py-4 px-10 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl text-lg"
		>
			Start an Order Now
			<span className="text-2xl">→</span>
		</Link>
	) : (
		<div className="flex flex-col sm:flex-row gap-4">
			<Button asChild variant="outline" size="lg" className="border-brand-dark-green text-brand-dark-green hover:bg-brand-cream/20 px-8">
				<Link to="/signin">Create an Account</Link>
			</Button>
			<Button asChild size="lg" className="bg-brand-dark-green text-brand-cream hover:bg-brand-dark-green/90 px-8">
				<Link to="/signin">Login to Order</Link>
			</Button>
		</div>
	);

	return (
		<div className="min-h-screen bg-gradient-to-b from-white to-brand-cream/5">
			<div className="container mx-auto px-4 py-12">
				<div className="space-y-8">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
						<div className="min-w-0">
							<h1 className="text-4xl md:text-6xl font-bold text-brand-dark-green">
								{school.name}
							</h1>
						</div>
						<div className="shrink-0">{orderCta}</div>
					</div>

					{renderMainItems()}

					<div className="flex justify-center w-full mt-16 mb-8">
						{orderCta}
					</div>
				</div>
			</div>
		</div>
	);
};

export default SchoolMenuPage;
