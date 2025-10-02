import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Wheat, Egg, Milk, Bean, ShoppingCart, Sparkles } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Main } from '@/models/item.model';

export interface MenuItemProps {
	item: Main;
	onOrderNow?: () => void;
    disabled?: boolean;
}

const allergenIcons: { [key: string]: React.ReactNode } = {
	gluten: <Wheat size={16} />,
	eggs: <Egg size={16} />,
	dairy: <Milk size={16} />,
	soy: <Bean size={16} />,
};

const MenuItemCard: React.FC<MenuItemProps> = ({ item, onOrderNow, disabled = false }) => {
	const { state } = useAppContext();
	// const navigate = useNavigate();

	const createAccount = () => {
		// navigate('/signin');
		console.log('Navigate to signin');
	};

	const login = () => {
		// navigate('/signin');
		console.log('Navigate to signin');
	};

	const handleOrderNow = () => {
		onOrderNow?.();
	};

	return (
		<>
			<Card className="group overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl flex flex-col h-full border-gray-200 hover:border-brand-dark-green/20">
				{/* Mobile Layout: Horizontal */}
				<div className="flex md:hidden">
					<div className="relative w-32 h-32 shrink-0">
						<img
							src={item.image}
							alt={item.display}
							className="absolute inset-0 w-full h-full object-cover"
						/>
						{item.isPromo && (
							<div className="absolute top-2 left-2">
								<Badge className="bg-purple-700 text-white border-0 text-xs px-2 py-0.5 flex items-center gap-1">
									<Sparkles className="h-3 w-3" />
									Promo
								</Badge>
							</div>
						)}
					</div>
					<div className="flex flex-col flex-1 p-3">
						<h3 className="font-semibold text-brand-dark-green mb-1 line-clamp-1">
							{item.display}
						</h3>
						<p className="text-brand-taupe text-sm line-clamp-2 mb-2 flex-1">{item.description}</p>
						<p className="text-lg font-bold text-brand-dark-green">${item.price.toFixed(2)}</p>
					</div>
				</div>

				{/* Desktop Layout: Vertical */}
				<div className="hidden md:flex md:flex-col h-full">
					<div className="relative w-full aspect-[4/3] overflow-hidden">
						<img
							src={item.image}
							alt={item.display}
							className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
						/>
						{item.isTeachersOnly && (
							<div className="absolute top-3 left-3">
								<Badge variant={"teachersOnly"} className="border-0 px-3 py-1 flex items-center gap-1.5 shadow-lg">
									<Sparkles className="h-3.5 w-3.5" />
									Teachers Only
								</Badge>
							</div>
						)}
						{item.isPromo && (
							<div className="absolute top-3 left-3">
								<Badge variant={"promo"} className="border-0 px-3 py-1 flex items-center gap-1.5 shadow-lg">
									<Sparkles className="h-3.5 w-3.5" />
									Promo
								</Badge>
							</div>
						)}
						{item.allergens && item.allergens.length > 0 && (
							<div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg flex gap-1.5">
								<TooltipProvider>
									{item.allergens.map((allergen) => (
										<Tooltip key={allergen}>
											<TooltipTrigger>
												<div className="w-7 h-7 rounded-full bg-brand-cream/80 flex items-center justify-center text-brand-dark-green hover:bg-brand-cream transition-colors">
													{allergenIcons[allergen.toLowerCase()] || (
														<span className="text-xs font-bold">{allergen[0].toUpperCase()}</span>
													)}
												</div>
											</TooltipTrigger>
											<TooltipContent>
												<p>{allergen}</p>
											</TooltipContent>
										</Tooltip>
									))}
								</TooltipProvider>
							</div>
						)}
						{/* Price Badge on Image */}
						<div className="absolute top-3 right-3">
							<div className="bg-brand-dark-green text-brand-cream px-3 py-1.5 rounded-lg shadow-lg">
								<p className="text-lg font-bold">${item.price.toFixed(2)}</p>
							</div>
						</div>
					</div>
					
					<div className="flex flex-col flex-grow">
						<CardHeader className="pb-3">
							<CardTitle className="text-xl font-semibold text-brand-dark-green group-hover:text-brand-dark-green/80 transition-colors line-clamp-1">
								{item.display}
							</CardTitle>
						</CardHeader>
						<CardContent className="flex-grow">
							<p className="text-brand-taupe text-sm leading-relaxed line-clamp-3">
								{item.description}
							</p>
						</CardContent>
						<CardFooter className="pt-0 pb-4 px-6">
							{state.user ? (
								<Button
                                    disabled={disabled}
									className="w-full bg-brand-dark-green text-brand-cream hover:bg-brand-dark-green/90 font-semibold h-11 text-base group-hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
									onClick={handleOrderNow}>
									<ShoppingCart className="h-4 w-4" />
									Order Now
								</Button>
							) : (
								<div className="w-full space-y-2">
									<Button
										onClick={createAccount}
										variant="outline"
										className="w-full h-10 border-brand-dark-green/20 hover:bg-brand-cream/10 transition-colors">
										Create an Account
									</Button>
									<Button
										onClick={login}
										className="w-full h-10 bg-brand-dark-green text-brand-cream hover:bg-brand-dark-green/90 transition-colors">
										Login to Order
									</Button>
								</div>
							)}
						</CardFooter>
					</div>
				</div>

				{/* Mobile CTA Buttons */}
				<div className="md:hidden border-t border-gray-100 p-3">
					{state.user ? (
						<Button
							className="w-full bg-brand-dark-green text-brand-cream hover:bg-brand-dark-green/90 font-semibold h-10 text-sm flex items-center justify-center gap-2"
							onClick={handleOrderNow}>
							<ShoppingCart className="h-4 w-4" />
							Order Now
						</Button>
					) : (
						<div className="flex gap-2">
							<Button
								onClick={createAccount}
								variant="outline"
								size="sm"
								className="flex-1 border-brand-dark-green/20 hover:bg-brand-cream/10">
								Sign Up
							</Button>
							<Button
								onClick={login}
								size="sm"
								className="flex-1 bg-brand-dark-green text-brand-cream hover:bg-brand-dark-green/90">
								Login
							</Button>
						</div>
					)}
				</div>
			</Card>
		</>
	);
};

export default MenuItemCard;