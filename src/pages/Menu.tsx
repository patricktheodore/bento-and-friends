import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Main } from '@/models/item.model';
import { Leaf } from 'lucide-react';

const MenuPage: React.FC = () => {
	const { state } = useAppContext();
    const navigate = useNavigate();

    // Get menu items for selected school or all items for guests
    const getFilteredMainItems = (): Main[] => {        
        return state.mains.filter(main => 
            main.isActive && main.isFeatured 
        );
    };

    const filteredMainItems = getFilteredMainItems();

	const sortedMains = filteredMainItems.sort((a, b) => {
        // Featured items first, then alphabetical
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return a.display.localeCompare(b.display);
    });

	const renderAddOns = () => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{(state.addOns).map((addon) => (
				<Card key={addon.id} className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-brand-dark-green/20">
					<CardHeader className="pb-3">
						<CardTitle className="text-lg group-hover:text-brand-dark-green transition-colors">{addon.display}</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-brand-dark-green">${addon.price.toFixed(2)}</p>
					</CardContent>
				</Card>
			))}
		</div>
	);

	const renderSides = () => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{(state.sides).map((side) => (
				<Card key={side.id} className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-brand-dark-green/20">
					<CardHeader>
						<CardTitle className="text-lg group-hover:text-brand-dark-green transition-colors">{side.display}</CardTitle>
					</CardHeader>
				</Card>
			))}
		</div>
	);

	const renderFruits = () => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{(state.fruits).map((fruit) => (
				<Card key={fruit.id} className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-brand-dark-green/20">
					<CardHeader>
						<CardTitle className="text-lg group-hover:text-brand-dark-green transition-colors">{fruit.display}</CardTitle>
					</CardHeader>
				</Card>
			))}
		</div>
	);

	const renderDrinks = () => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{(state.drinks).map((drink) => (
				<Card key={drink.id} className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-brand-dark-green/20">
					<CardHeader className="pb-3">
						<CardTitle className="text-lg group-hover:text-brand-dark-green transition-colors">{drink.display}</CardTitle>
					</CardHeader>
					<CardContent>
						{drink.image && (
							<img
								src={drink.image}
								alt={drink.display}
								className="w-full h-40 object-cover rounded-lg mb-3 group-hover:scale-105 transition-transform duration-300"
							/>
						)}
						<p className="text-2xl font-bold text-brand-dark-green">${drink.price.toFixed(2)}</p>
					</CardContent>
				</Card>
			))}
		</div>
	);

    const renderMainItems = () => {
        // Show loading state for logged in users
        if (state.user && (state.isLoading)) {
            return (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark-green mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading menu items...</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedMains.map((item) => (
                    <Card key={item.id} className="group overflow-hidden transition-all duration-300 border-gray-200 hover:border-brand-dark-green/20">
                        <div className="relative overflow-hidden">
                            <img
                                src={item.image}
                                alt={item.display}
                                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                <p className='text-3xl font-bold text-white'>${item.price.toFixed(2)}</p>
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
                                    <Badge
                                        key={allergen}
                                        variant="outline"
                                        className="uppercase text-xs"
                                    >
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

	return (
		<div className="min-h-screen bg-gradient-to-b from-white to-brand-cream/5">
			<div className="container mx-auto px-4 py-12">
				<Tabs defaultValue="mains" className="space-y-8">
					{/* Header Section with Title, School Selector, and Tabs */}
					<div className="space-y-8">
						{/* Top Row: Title and School Selector Combined */}
						<div className="flex-1">
							<h1 className="text-4xl md:text-6xl font-bold text-brand-dark-green">
								Menu
							</h1>
						</div>

						{/* Bottom Row: Tabs */}
						<div className="flex justify-center lg:justify-start">
							<ScrollArea className="w-fit max-w-3xl">
								<TabsList className="inline-flex items-center justify-start rounded-lg bg-brand-taupe p-1 text-brand-cream w-full backdrop-blur-sm">
									<TabsTrigger 
										value="mains" 
										className="whitespace-nowrap flex-1 sm:flex-initial data-[state=active]:bg-brand-dark-green data-[state=active]:text-brand-cream rounded-lg px-6 transition-all"
									>
										Main Dishes
									</TabsTrigger>
									<TabsTrigger 
										value="addons" 
										className="whitespace-nowrap flex-1 sm:flex-initial data-[state=active]:bg-brand-dark-green data-[state=active]:text-brand-cream rounded-lg px-6 transition-all"
									>
										Add-ons
									</TabsTrigger>
									<TabsTrigger 
										value="sides" 
										className="whitespace-nowrap flex-1 sm:flex-initial data-[state=active]:bg-brand-dark-green data-[state=active]:text-brand-cream rounded-lg px-6 transition-all"
									>
										Sides
									</TabsTrigger>
									<TabsTrigger 
										value="fruits" 
										className="whitespace-nowrap flex-1 sm:flex-initial data-[state=active]:bg-brand-dark-green data-[state=active]:text-brand-cream rounded-lg px-6 transition-all"
									>
										Fruits
									</TabsTrigger>
								</TabsList>
							</ScrollArea>
						</div>
					</div>

					<TabsContent value="mains" className="mt-8">{renderMainItems()}</TabsContent>
					<TabsContent value="addons" className="mt-8">{renderAddOns()}</TabsContent>
					<TabsContent value="sides" className="mt-8">{renderSides()}</TabsContent>
					<TabsContent value="fruits" className="mt-8">{renderFruits()}</TabsContent>
					<TabsContent value="drinks" className="mt-8">{renderDrinks()}</TabsContent>

					<div className="flex justify-center w-full mt-16 mb-8">
						{state.user ? (
							<div className="text-center">
								<Link
									to="/order"
									className="inline-flex items-center gap-3 bg-brand-dark-green text-brand-cream hover:bg-brand-dark-green/90 font-bold py-4 px-10 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl text-lg"
								>
									Start an Order Now
									<span className="text-2xl">→</span>
								</Link>
							</div>
						) : (
							<div className="flex flex-col sm:flex-row gap-4">
								<Button
									onClick={() => navigate('/signin')}
									variant="outline"
									size="lg"
									className="border-brand-dark-green text-brand-dark-green hover:bg-brand-cream/20 px-8"
								>
									Create an Account
								</Button>
								<Button
									onClick={() => navigate('/signin')}
									size="lg"
									className="bg-brand-dark-green text-brand-cream hover:bg-brand-dark-green/90 px-8"
								>
									Login to Order
								</Button>
							</div>
						)}
					</div>
				</Tabs>
			</div>
		</div>
	);
};

export default MenuPage;