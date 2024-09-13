import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wheat, Egg, Milk, Bean, Leaf } from 'lucide-react';

export interface MenuItemProps {
	image?: string;
	title: string;
	description: string;
	allergens?: string[];
	isVegetarian?: boolean;
	onOrderNow: () => void;
}

const allergenIcons: { [key: string]: React.ReactNode } = {
	gluten: <Wheat size={18} />,
	eggs: <Egg size={18} />,
	dairy: <Milk size={18} />,
	soy: <Bean size={18} />,
};

const MenuItemCard: React.FC<MenuItemProps> = ({ image, title, description, allergens, isVegetarian, onOrderNow }) => {
	return (
		<Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg flex flex-col h-full">
			<div className="overflow-hidden h-48 relative">
				<img
					src={image || '/api/placeholder/400/300'}
					alt={title}
					className="w-full h-full object-cover transition-transform duration-300 ease-in-out hover:scale-110"
				/>
				{allergens && allergens.length > 0 && (
					<div className="absolute bottom-2 right-2 bg-white bg-opacity-50 rounded-full p-1 flex gap-1">
						<TooltipProvider>
							{allergens.map((allergen) => (
								<Tooltip key={allergen}>
									<TooltipTrigger>
										<span className="text-brand-dark-green">
											{allergenIcons[allergen.toLowerCase()] || allergen[0].toUpperCase()}
										</span>
									</TooltipTrigger>
									<TooltipContent>
										<p>Contains {allergen}</p>
									</TooltipContent>
								</Tooltip>
							))}
						</TooltipProvider>
					</div>
				)}
			</div>
			<div className="flex flex-col flex-grow">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg font-semibold text-brand-dark-green">
						<span>{title}</span>
						{isVegetarian && (
							<TooltipProvider>
								<Tooltip>
								<TooltipTrigger>
									<Leaf className="h-5 w-5 text-green-500" />
								</TooltipTrigger>
								<TooltipContent>
									<p>Vegetarian</p>
								</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent className="flex-grow">
					<p className="text-brand-taupe text-sm">{description}</p>
				</CardContent>
				<CardFooter className="mt-auto">
					<Button
						className="w-full bg-brand-cream text-brand-dark-green hover:bg-brand-dark-green hover:text-brand-cream"
						onClick={onOrderNow}
					>
						Order now
					</Button>
				</CardFooter>
			</div>
		</Card>
	);
};

export default MenuItemCard;
