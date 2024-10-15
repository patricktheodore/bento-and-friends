import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wheat, Egg, Milk, Bean } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';

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



const MenuItemCard: React.FC<MenuItemProps> = ({ image, title, description, allergens, onOrderNow }) => {
	const { state } = useAppContext();
    const navigate = useNavigate();

	const createAccount = () => {
		navigate('/signin');
	};
	
	const login = () => {
		navigate('/signin');
	};
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
					</CardTitle>
				</CardHeader>
				<CardContent className="flex-grow">
					<p className="text-brand-taupe text-sm">{description}</p>
				</CardContent>
				<CardFooter className="mt-auto flex justify-center items-center gap-2">
					{state.user ? (
						<Button
							className="w-full bg-brand-cream text-brand-dark-green hover:bg-brand-dark-green hover:text-brand-cream"
							onClick={onOrderNow}
						>
							Order now
						</Button>

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

				</CardFooter>
			</div>
		</Card>
	);
};

export default MenuItemCard;
