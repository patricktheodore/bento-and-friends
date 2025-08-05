import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X, Trash2, AlertTriangle, Edit } from 'lucide-react';
import { Meal } from '@/models/order.model';
import { toast } from 'react-hot-toast';
import DiscountMessage from './DiscountMessage';
import { formatDate } from '@/utils/utils';
import { Alert, AlertDescription } from './ui/alert';
import { isValidDateCheck } from '@/utils/dateValidation';
import { useNavigate } from 'react-router-dom';
import OrderDialog from './OrderDialog';

const Cart: React.FC = () => {
	const { state, dispatch } = useAppContext();
	const [duplicateOrders, setDuplicateOrders] = useState<{ childName: string; date: string }[]>([]);
    const [showOrderDialog, setShowOrderDialog] = useState(false);
    const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
    const navigate = useNavigate();

	// Sort meals by delivery date (earliest first)
	const sortedMeals = useMemo(() => {
		if (!state.cart?.meals) return [];
		
		return [...state.cart.meals].sort((a, b) => {
			const dateA = new Date(a.deliveryDate);
			const dateB = new Date(b.deliveryDate);
			return dateA.getTime() - dateB.getTime();
		});
	}, [state.cart?.meals]);

	const checkDuplicateOrders = useMemo(() => {
		if (!state.cart) return [];

		const orderMap = new Map<string, Set<string>>();
		const duplicates: { childName: string; date: string }[] = [];

		state.cart.meals.forEach((meal: Meal) => {
			const key = `${meal.child.id}-${meal.deliveryDate}`;
			if (!orderMap.has(key)) {
				orderMap.set(key, new Set());
			}
			orderMap.get(key)!.add(meal.id);

			if (orderMap.get(key)!.size > 1) {
				duplicates.push({
					childName: meal.child.name,
					date: formatDate(meal.deliveryDate),
				});
			}
		});

		return duplicates;
	}, [state.cart]);

	useEffect(() => {
		setDuplicateOrders(checkDuplicateOrders);
	}, [checkDuplicateOrders]);

	const calculateDiscount = (mealCount: number) => {
		if (mealCount >= 5) return 0.2;
		if (mealCount >= 3) return 0.1;
		if (mealCount >= 2) return 0.05;
		return 0;
	};

	const { bundleDiscountedTotal, bundleDiscountPercentage } = useMemo(() => {
		if (!state.cart) return { bundleDiscountedTotal: 0, bundleDiscountPercentage: 0 };

		const mealCount = state.cart.meals.length;
		const discount = calculateDiscount(mealCount);
		const bundleDiscountedTotal = state.cart.total * (1 - discount);

		return {
			bundleDiscountedTotal,
			bundleDiscountPercentage: discount * 100,
		};
	}, [state.cart]);

	const calculateDiscountedPrice = (mealPrice: number) => {
		const discount = calculateDiscount(state.cart?.meals.length || 0);
		return mealPrice * (1 - discount);
	};

    const editMeal = (meal: Meal) => {
        setSelectedMeal(meal);
        setShowOrderDialog(true);
    };

    const handleCloseModal = () => {
        setShowOrderDialog(false);
        setSelectedMeal(null);
    };

	const closeCart = () => {
		dispatch({ type: 'TOGGLE_CART' });
	};

	const removeMeal = (mealId: string) => {
		dispatch({ type: 'REMOVE_FROM_CART', payload: mealId });
		toast.success('Item removed from cart');
	};

    const isInvalidDate = (meal: Meal):boolean => {
        let validDates = [];

        const main = state.mains.find(m => m.id === meal.main.id);
        const school = meal.school;

        if (main?.isPromo && main?.validDates) {
            validDates = main.validDates;
        } else if (school?.validDates) {
            validDates = school.validDates;
        } else {
            return false; // No valid dates to check against
        }

        return !(isValidDateCheck(new Date(meal.deliveryDate), validDates));
    };

	const handleUpdate = (meals: Meal | Meal[]) => {
		if (!state.cart) {
			toast.error('Your cart is empty');
			return;
		}

		const mealsArray = Array.isArray(meals) ? meals : [meals];
		
		mealsArray.forEach(meal => {
			dispatch({
				type: 'UPDATE_MEAL',
				payload: meal,
			});
		});
		
		handleCloseModal();
	}

    const handleCheckout = async () => {
        if (!state.cart || state.cart.meals.length === 0) {
            toast.error('Your cart is empty');
            return;
        }

        if (!state.user) {
            toast.error('You must be logged in to checkout');
            return;
        }

        if (!state.cart.meals.every(meal => !isInvalidDate(meal))) {
            toast.error('Some meals have invalid delivery dates. Please update or remove them before proceeding.');
            return;
        }

        closeCart();
        navigate('/checkout');
    }

    const clearCart = () => {
        dispatch({ type: 'CLEAR_CART' });
        toast.success('Cart cleared');
    };

    const getMealDetails = (meal: Meal) => {
        const details = [];
        
        // Add add-ons
        if (meal.addOns.length > 0) {
            details.push(...meal.addOns.map(addon => addon.display));
        }
        
        // Only show sides/fruits if they weren't disabled
        if (!meal.main.disableSidesSelection) {
            details.push(meal.side ? meal.side.display : 'No side');
            details.push(meal.fruit ? meal.fruit.display : 'No fruit');
        }
        
        return details.join(' - ');
    };

	return (
		<Sheet
			open={state.isCartOpen}
			onOpenChange={closeCart}>
			<SheetContent
				side="right"
				className="w-full md:w-[400px] flex flex-col h-full p-0 gap-0">
				<div className="flex-shrink-0 p-6 pb-2 border-b">
					<SheetHeader className="space-y-0 gap-y-2">
						<div className="flex flex-row justify-between items-center">
							<SheetTitle>Your Cart</SheetTitle>
							<Button
								variant="ghost"
								size="icon"
								onClick={closeCart}>
								<X className="h-4 w-4" />
							</Button>
						</div>
						{state.cart && (
							<DiscountMessage
								mealCount={state.cart.meals.length}
								currentDiscount={bundleDiscountPercentage}
							/>
						)}
					</SheetHeader>
				</div>

				<ScrollArea className="flex-grow py-4 px-6">
					{duplicateOrders.length > 0 && (
						<Alert
							variant="destructive"
							className="mb-4">
							<AlertTriangle className="h-4 w-4" />
							<AlertDescription>
								Warning: You have ordered multiple meals for the same child on the same day:
								<ul className="list-disc list-inside">
									{duplicateOrders.map((order, index) => (
										<li key={index}>
											{order.childName} on {order.date}
										</li>
									))}
								</ul>
							</AlertDescription>
						</Alert>
					)}

					{state.cart && sortedMeals.length > 0 ? (
						sortedMeals.map((meal:Meal) => (
							<div
								key={meal.id}
								className="py-4 border-b">
								<h3 className="font-semibold">{meal.main.display}</h3>
								{isInvalidDate(meal) && (
									<Alert
										variant="destructive"
										className="mt-2 mb-2">
										<AlertTriangle className="h-4 w-4" />
										<AlertDescription>
											This meal's delivery date in invalid. Either it has passed, or the school does not offer service for this date. Please update or remove it.
										</AlertDescription>
									</Alert>
								)}
								<p className="text-sm text-gray-500">
									{getMealDetails(meal)}
								</p>
								<p className="text-sm">
									{meal.child.name} - {formatDate(meal.deliveryDate)}
								</p>

								{bundleDiscountPercentage > 0 ? (
									<span>
										<span className="text-sm font-medium line-through mr-2">
											${meal.total.toFixed(2)}
										</span>
										<span className="text-sm font-medium">
											${calculateDiscountedPrice(meal.total).toFixed(2)}
										</span>
									</span>
								) : (
									<p className="text-sm font-medium">${meal.total.toFixed(2)}</p>
								)}

                                <div className='mt-2 flex justify-start items-center gap-2'>
                                    <Button
										variant="default"
										size="sm"
										onClick={() => editMeal(meal)}>
										<Edit className="h-4 w-4 mr-2" /> Edit
									</Button>
                                    <Button
										variant="destructive"
										size="sm"
										onClick={() => removeMeal(meal.id)}>
										<Trash2 className="h-4 w-4 mr-2" /> Remove
									</Button>
                                </div>
							</div>
						))
					) : (
						<p className="text-center py-4">Your cart is empty</p>
					)}
				</ScrollArea>

				{state.cart && state.cart.meals.length > 0 && (
					<div className="flex-shrink-0 p-6 pt-2 bg-background border-t">
						<span className="font-semibold text-lg flex justify-between items-center">
							<p>Bundle Discount:</p>
							<p>-${(state.cart.total - bundleDiscountedTotal).toFixed(2)}</p>
						</span>
						<span className="font-semibold text-lg flex justify-between items-center">
							<p>Total:</p>
							<p>${bundleDiscountedTotal.toFixed(2)}</p>
						</span>
						
						<Button
							onClick={handleCheckout}
							className="w-full mt-4">
							Proceed to Checkout
						</Button>
						<Button
                            variant={"outline"}
							onClick={clearCart}
							className="w-full mt-4">
                            Clear Cart
						</Button>
					</div>
				)}
			</SheetContent>

            {showOrderDialog && (
                <OrderDialog
                    key={`${selectedMeal?.id}-dialog`}
                    isOpen={showOrderDialog}
                    onClose={handleCloseModal}
                    editingMeal={selectedMeal}
                    onSave={handleUpdate}
                />
            )}
		</Sheet>
	);
};

export default Cart;