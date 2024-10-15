import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Main } from '@/models/item.model';
import { Meal } from '@/models/order.model';
import OrderDialog from '@/components/OrderDialog';

const MenuPage: React.FC = () => {
	const { state, dispatch } = useAppContext();
    const navigate = useNavigate();
    const [selectedMain, setSelectedMain] = useState<Main | null>(null);
    const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

	

	const renderAddOns = () => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{state.addOns.map((addon) => (
				<Card key={addon.id}>
					<CardHeader>
						<CardTitle>{addon.display}</CardTitle>
					</CardHeader>
					<CardContent>
						<p>Price: ${addon.price.toFixed(2)}</p>
					</CardContent>
				</Card>
			))}
		</div>
	);

	const renderProbiotics = () => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{state.probiotics.map((probiotic) => (
				<Card key={probiotic.id}>
					<CardHeader>
						<CardTitle>{probiotic.display}</CardTitle>
					</CardHeader>
				</Card>
			))}
		</div>
	);

	const renderFruits = () => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{state.fruits.map((fruit) => (
				<Card key={fruit.id}>
					<CardHeader>
						<CardTitle>{fruit.display}</CardTitle>
					</CardHeader>
				</Card>
			))}
		</div>
	);

	const createAccount = () => {
		navigate('/signin');
	};

	const login = () => {
		navigate('/signin');
	};

	const renderDrinks = () => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{state.drinks.map((drink) => (
				<Card key={drink.id}>
					<CardHeader>
						<CardTitle>{drink.display}</CardTitle>
					</CardHeader>
					<CardContent>
						{drink.image && (
							<img
								src={drink.image}
								alt={drink.display}
								className="w-full h-32 object-cover rounded-md mb-2"
							/>
						)}
						<p>Price: ${drink.price.toFixed(2)}</p>
					</CardContent>
				</Card>
			))}
		</div>
	);

	const handleOrderNow = (item: Main) => {
        setSelectedMain(item);
        setIsOrderDialogOpen(true);
    };

    const handleAddToCart = (meals: Meal[]) => {
        meals.forEach(meal => {
            dispatch({ type: 'ADD_TO_CART', payload: meal });
        });
        setIsOrderDialogOpen(false);
    };

    const renderMainItems = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.mains.map((item) => (
                <Card key={item.id}>
                    <CardHeader>
                        <CardTitle>{item.display}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <img
                            src={item.image}
                            alt={item.display}
                            className="w-full h-48 object-cover rounded-md mb-4"
                        />
                        <div className="flex flex-wrap gap-2 mb-2">
                            {item.isNew && <Badge variant="default">New</Badge>}
                            {item.isVegetarian && <Badge variant="secondary">Vegetarian</Badge>}
                            {item.allergens?.map((allergen) => (
                                <Badge
                                    key={allergen}
                                    variant="outline"
                                    className="uppercase"
                                >
                                    {allergen}
                                </Badge>
                            ))}
                        </div>
                        <p className='text-lg font-bold'>${item.price.toFixed(2)}</p>
                        {state.user ? (
                            <Button
                                className="w-full mt-2"
                                onClick={() => handleOrderNow(item)}
                            >
                                Order Now
                            </Button>
                        ) : (
                            <div className="flex justify-center mt-2 gap-2">
                                <Button onClick={() => navigate('/signin')} variant="outline">Create Account</Button>
                                <Button onClick={() => navigate('/signin')}>Login to Order</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );

	return (
		<div className="container mx-auto p-4 py-8">
			<Tabs defaultValue="mains" className="space-y-4">
				<div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center">
					<h1 className="text-3xl md:text-5xl font-bold leading-tight">Our Menu</h1>
					<ScrollArea className="w-full md:w-auto">
						<TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full md:w-auto">
							<TabsTrigger value="mains" className="whitespace-nowrap">Main Dishes</TabsTrigger>
							<TabsTrigger value="addons" className="whitespace-nowrap">Add-ons</TabsTrigger>
							<TabsTrigger value="probiotics" className="whitespace-nowrap">Probiotics</TabsTrigger>
							<TabsTrigger value="fruits" className="whitespace-nowrap">Fruits</TabsTrigger>
							{/* <TabsTrigger value="drinks" className="whitespace-nowrap">Drinks</TabsTrigger> */}
						</TabsList>
					</ScrollArea>
				</div>
				<TabsContent value="mains">{renderMainItems()}</TabsContent>
				<TabsContent value="addons">{renderAddOns()}</TabsContent>
				<TabsContent value="probiotics">{renderProbiotics()}</TabsContent>
				<TabsContent value="fruits">{renderFruits()}</TabsContent>
				<TabsContent value="drinks">{renderDrinks()}</TabsContent>

				<div className="flex justify-center w-full mt-12 mb-8 gap-2">
					{state.user ? (
						<div className="text-center">
							<Link
								to="/order"
								className="inline-block bg-brand-cream text-brand-dark-green hover:brightness-110 font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:shadow-lg ring-2 ring-transparent hover:ring-brand-cream ring-offset-2 ring-offset-brand-dark-green"
							>
								Start an Order Now &rarr;
							</Link>
						</div>
					) : (
						<>
							<Button
								onClick={createAccount}
								variant="outline"
							>
								Create an Account
							</Button>
							<Button
								onClick={login}
								variant="default"
							>
								Login to Order
							</Button>
						</>
					)}
				</div>
			</Tabs>
			{selectedMain && (
                <OrderDialog
                    isOpen={isOrderDialogOpen}
                    onClose={() => setIsOrderDialogOpen(false)}
                    selectedMain={selectedMain}
                    addOns={state.addOns}
                    children={state.user?.children || []}
                    schools={state.schools}
                    onAddToCart={handleAddToCart}
                />
            )}
		</div>
	);
};

export default MenuPage;
