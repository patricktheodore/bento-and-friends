import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Meal } from '@/models/order.model';
import { AddOn, Main } from '@/models/item.model';
import { loadStripe } from '@stripe/stripe-js';
import { getFunctions, httpsCallable } from 'firebase/functions';

const stripePromise = loadStripe(
	'pk_test_51PzenCRuOSdR9YdWK6BbtR2MPhP4jAjNBUPTBg0LGUOJgHmMtL6g90lToUiAoly4VzrXe9BtYVBUoQWR7Bmqa4ND00YsOJX1om'
);

interface CheckoutSessionResponse {
	sessionId: string;
}

const CheckoutPage: React.FC = () => {
	const { state, dispatch } = useAppContext();
	const { cart, user } = state;
	const [editingMeal, setEditingMeal] = React.useState<Meal | null>(null);
	const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [isProcessing, setIsProcessing] = React.useState(false);

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

	const removeMeal = (mealId: string) => {
		dispatch({ type: 'REMOVE_FROM_CART', payload: mealId });
		toast.success('Item removed from cart');
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

	if (!cart || cart.meals.length === 0) {
		return (
			<div className="container mx-auto p-4 py-8">
				<h1 className="text-4xl font-bold mb-6">Checkout</h1>
				<p>Your cart is empty. Please add items to your cart before checking out.</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8 max-w-4xl">
			<h1 className="text-2xl font-bold mb-6">Checkout</h1>
			<div className="space-y-6">
				{cart.meals.map((meal) => (
					<div
						key={meal.id}
						className="border p-4 rounded-md shadow-sm"
					>
						<div className="flex flex-wrap justify-between items-start">
							<div className="w-full sm:w-2/3">
								<h3 className="font-semibold text-lg">{meal.main.display}</h3>
								<p className="text-sm text-gray-500">
									{meal.addOns.map((addon) => addon.display).join(', ')}
								</p>
								<p className="text-sm">
									{meal.child.name} - {new Date(meal.orderDate).toLocaleDateString()}
								</p>
							</div>
							<div className="w-full sm:w-1/3 mt-2 sm:mt-0 text-right">
								<p className="text-lg font-medium">${meal.total.toFixed(2)}</p>
							</div>
						</div>
						<div className="flex justify-end space-x-2 mt-4">
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
											{/* Main Dish */}
											<div>
												<label className="text-sm font-medium">Main Dish</label>
												<Select
													value={editingMeal.main.id}
													onValueChange={(value) => {
														const newMain = state.mains.find((main) => main.id === value)!;
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
											{/* Add-ons */}
											<div>
												<label className="text-sm font-medium">Add-ons</label>
												{state.addOns.map((addon) => (
													<div
														key={addon.id}
														className="flex items-center space-x-2 mb-2"
													>
														<Checkbox
															id={addon.id}
															checked={editingMeal.addOns.some((a) => a.id === addon.id)}
															onCheckedChange={() => handleAddOnToggle(addon.id)}
														/>
														<Label htmlFor={addon.id}>{addon.display}</Label>
													</div>
												))}
											</div>
											{/* Child */}
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
											{/* Date */}
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
											{/* Special Instructions */}
											<div>
												<label className="text-sm font-medium">Special Instructions</label>
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
				))}
			</div>
			<div className="mt-8 border-t pt-6">
				<div className="flex justify-between items-center mb-4">
					<p className="text-xl font-semibold">Total:</p>
					<p className="text-2xl font-bold">${cart.total.toFixed(2)}</p>
				</div>
				<Button
					onClick={handleCheckout}
					className="w-full sm:w-auto sm:min-w-[200px] sm:float-right"
                    disabled={isProcessing}
				>
							{isProcessing ? 'Processing...' : 'Proceed to Checkout'}
                </Button>
			</div>
		</div>
	);
};

export default CheckoutPage;