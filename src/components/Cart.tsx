import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X, Trash2, Edit2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Meal } from '@/models/order.model';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AddOn, Main } from '@/models/item.model';
import { toast } from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { getFunctions, httpsCallable } from 'firebase/functions';

const stripePromise = loadStripe(
	'pk_test_51PzenCRuOSdR9YdWK6BbtR2MPhP4jAjNBUPTBg0LGUOJgHmMtL6g90lToUiAoly4VzrXe9BtYVBUoQWR7Bmqa4ND00YsOJX1om'
);

interface CheckoutSessionResponse {
	sessionId: string;
}

const Cart: React.FC = () => {
	const { state, dispatch } = useAppContext();
	const { cart, isCartOpen, user } = state;
	const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);

	const closeCart = () => dispatch({ type: 'TOGGLE_CART' });

	const removeMeal = (mealId: string) => {
		dispatch({ type: 'REMOVE_FROM_CART', payload: mealId });
		toast.success('Item removed from cart');
	};

	const startEditing = (meal: Meal) => {
		setEditingMeal({ ...meal });
		setIsDialogOpen(true);
	};

	const updateMeal = () => {
		if (editingMeal) {
			dispatch({
				type: 'UPDATE_MEAL',
				payload: editingMeal,
			});
			toast.success('Order updated');
		}
		setEditingMeal(null);
		setIsDialogOpen(false);
	};

	const cancelEdit = () => {
		setEditingMeal(null);
		setIsDialogOpen(false);
	};

	const isValidDate = (date: Date) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const day = date.getDay();
		const isWeekend = day === 0 || day === 6;
		const isPast = date <= today;

		return isWeekend || isPast;
	};

	const handleCheckout = async () => {
		if (!cart) return;

		setIsProcessing(true);
		const stripe = await stripePromise;
		const functions = getFunctions();
		const createCheckoutSession = httpsCallable<{ cart: typeof cart; successUrl: string; cancelUrl: string }, CheckoutSessionResponse>(functions, 'createCheckoutSession');

		try {
			const result = await createCheckoutSession({
				cart,
				successUrl: `${window.location.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
				cancelUrl: `${window.location.origin}/checkout`,
			});

			const { sessionId } = result.data;

			if (stripe && sessionId) {
				const { error } = await stripe.redirectToCheckout({ sessionId });

				if (error) {
					toast.error(error.message || 'An error occurred during checkout');
				}
			} else {
				throw new Error('Failed to create checkout session');
			}
		} catch (error) {
			console.error('Error:', error);
			toast.error('An error occurred during checkout');
		} finally {
			setIsProcessing(false);
		}
	};

	const handleAddOnToggle = (addonId: string) => {
		if (editingMeal) {
			const updatedAddOns = editingMeal.addOns.some((addon) => addon.id === addonId)
				? editingMeal.addOns.filter((addon) => addon.id !== addonId)
				: [...editingMeal.addOns, state.addOns.find((addon) => addon.id === addonId)!];

			setEditingMeal({
				...editingMeal,
				addOns: updatedAddOns,
				total: calculateTotal(editingMeal.main, updatedAddOns),
			});
		}
	};

	const calculateTotal = (main: Main, addOns: AddOn[]) => {
		return main.price + addOns.reduce((sum, addon) => sum + addon.price, 0);
	};

	return (
		<Sheet
			open={isCartOpen}
			onOpenChange={closeCart}
		>
			<SheetContent
				side="right"
				className="w-full md:w-[400px] custom-sheet-header"
			>
				<SheetHeader className="flex flex-row justify-between items-center space-y-0">
					<SheetTitle>Your Cart</SheetTitle>
					<Button
						variant="ghost"
						size="icon"
						onClick={closeCart}
					>
						<X className="h-4 w-4" />
					</Button>
				</SheetHeader>
				<ScrollArea className="h-[calc(100vh-12rem)] mt-4">
					{cart && cart.meals.length > 0 ? (
						cart.meals.map((meal) => (
							<div
								key={meal.id}
								className="py-4 border-b"
							>
								<h3 className="font-semibold">{meal.main.display}</h3>
								<p className="text-sm text-gray-500">
									{meal.addOns.map((addon) => addon.display).join(', ')}
								</p>
								<p className="text-sm">
									{meal.child.name} - {new Date(meal.orderDate).toLocaleDateString()}
								</p>
								<p className="text-sm font-medium">${meal.total.toFixed(2)}</p>
								<div className="flex justify-end space-x-2 mt-2">
									<Dialog
										open={isDialogOpen}
										onOpenChange={setIsDialogOpen}
									>
										<DialogTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												onClick={() => startEditing(meal)}
											>
												<Edit2 className="h-4 w-4 mr-1" /> Edit
											</Button>
										</DialogTrigger>
										<DialogContent className="sm:max-w-[425px]">
											<DialogHeader>
												<DialogTitle>Edit Order</DialogTitle>
											</DialogHeader>
											{editingMeal && (
												<div className="space-y-4 mt-4">
													<div>
														<label className="text-sm font-medium">Main Dish</label>
														<Select
															value={editingMeal.main.id}
															onValueChange={(value) => {
																const newMain = state.mains.find(
																	(main) => main.id === value
																)!;
																setEditingMeal({
																	...editingMeal,
																	main: newMain,
																	total: calculateTotal(newMain, editingMeal.addOns),
																});
															}}
														>
															<SelectTrigger>
																<SelectValue placeholder="Select main dish" />
															</SelectTrigger>
															<SelectContent>
																{state.mains.map((main) => (
																	<SelectItem
																		key={main.id}
																		value={main.id}
																	>
																		{main.display}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</div>
													<div>
														<label className="text-sm font-medium">Add-ons</label>
														{state.addOns.map((addon) => (
															<div
																key={addon.id}
																className="flex items-center space-x-2 mb-2"
															>
																<Checkbox
																	id={addon.id}
																	checked={editingMeal.addOns.some(
																		(a) => a.id === addon.id
																	)}
																	onCheckedChange={() => handleAddOnToggle(addon.id)}
																/>
																<Label htmlFor={addon.id}>{addon.display}</Label>
															</div>
														))}
													</div>
													<div>
														<label className="text-sm font-medium">Child</label>
														<Select
															value={editingMeal.child.id}
															onValueChange={(value) => {
																const newChild = user?.children.find(
																	(child) => child.id === value
																)!;
																setEditingMeal({ ...editingMeal, child: newChild });
															}}
														>
															<SelectTrigger>
																<SelectValue placeholder="Select a child" />
															</SelectTrigger>
															<SelectContent>
																{user?.children.map((child) => (
																	<SelectItem
																		key={child.id}
																		value={child.id}
																	>
																		{child.name}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</div>
													<div>
														<label className="text-sm font-medium">Date</label>
														<Calendar
															mode="single"
															selected={new Date(editingMeal.orderDate)}
															onSelect={(date) =>
																date &&
																setEditingMeal({
																	...editingMeal,
																	orderDate: date.toISOString(),
																})
															}
															disabled={isValidDate}
															className="rounded-md border"
														/>
													</div>
													<div>
														<label className="text-sm font-medium">
															Special Instructions
														</label>
														<Textarea
															value={editingMeal.note}
															onChange={(e) =>
																setEditingMeal({ ...editingMeal, note: e.target.value })
															}
															placeholder="Any special instructions for your order"
														/>
													</div>
												</div>
											)}
											<DialogFooter>
												<Button
													variant="outline"
													onClick={cancelEdit}
												>
													Cancel
												</Button>
												<Button onClick={updateMeal}>Save Changes</Button>
											</DialogFooter>
										</DialogContent>
									</Dialog>
									<Button
										variant="destructive"
										size="sm"
										onClick={() => removeMeal(meal.id)}
									>
										<Trash2 className="h-4 w-4 mr-1" /> Remove
									</Button>
								</div>
							</div>
						))
					) : (
						<p className="text-center py-4">Your cart is empty</p>
					)}
				</ScrollArea>
				{cart && cart.meals.length > 0 && (
					<div className="mt-4">
						<p className="font-semibold text-lg">Total: ${cart.total.toFixed(2)}</p>
						<Button
							onClick={handleCheckout}
							className="w-full mt-2"
							disabled={isProcessing}
						>
							{isProcessing ? 'Processing...' : 'Proceed to Checkout'}
						</Button>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
};

export default Cart;
