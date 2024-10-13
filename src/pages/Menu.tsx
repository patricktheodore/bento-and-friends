import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, Navigate, useNavigate } from 'react-router-dom';

const MenuPage: React.FC = () => {
	const { state } = useAppContext();
    const navigate = useNavigate();

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
					</CardContent>
				</Card>
			))}
		</div>
	);

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

	return (
		<div className="container mx-auto p-4 py-8">
			<Tabs defaultValue="mains">
				<div className="w-full flex justify-between items-center">
					<h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4">Our Menu</h1>
					<TabsList>
						<TabsTrigger value="mains">Main Dishes</TabsTrigger>
						<TabsTrigger value="addons">Add-ons</TabsTrigger>
						<TabsTrigger value="probiotics">Probiotics</TabsTrigger>
						<TabsTrigger value="fruits">Fruits</TabsTrigger>
						{/* <TabsTrigger value="drinks">Drinks</TabsTrigger> */}
					</TabsList>
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
		</div>
	);
};

export default MenuPage;
