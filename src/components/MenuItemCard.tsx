import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface MenuItemProps {
	image?: string;
	title: string;
	description: string;
	onOrderNow: () => void;
}

const MenuItemCard: React.FC<MenuItemProps> = ({ image, title, description, onOrderNow }) => {
	return (
		<Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg flex flex-col h-full">
			<div className="overflow-hidden h-48">
				<img
					src={image || '/api/placeholder/400/300'}
					alt={title}
					className="w-full h-full object-cover transition-transform duration-300 ease-in-out hover:scale-110"
				/>
			</div>
			<div className="flex flex-col flex-grow">
				<CardHeader>
					<CardTitle className="text-lg font-semibold text-brand-dark-green">{title}</CardTitle>
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
