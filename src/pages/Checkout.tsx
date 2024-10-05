import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Meal, Order } from '@/models/order.model';
import { AddOn, Main } from '@/models/item.model';
import { loadStripe } from '@stripe/stripe-js';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Coupon } from '@/models/user.model';
import { validateCoupon } from '@/services/coupon-service';
import { Input } from '@/components/ui/input';
import DiscountMessage from '../components/DiscountMessage';

const stripePromise = loadStripe(
	'pk_test_51PzenCRuOSdR9YdWK6BbtR2MPhP4jAjNBUPTBg0LGUOJgHmMtL6g90lToUiAoly4VzrXe9BtYVBUoQWR7Bmqa4ND00YsOJX1om'
);

const CheckoutPage: React.FC = () => {
	const { state, dispatch } = useAppContext();
	const { cart, user } = state;
	const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [couponCode, setCouponCode] = useState('');
	const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

	const calculateDiscount = (mealCount: number) => {
		if (mealCount >= 5) return 0.2;
		if (mealCount >= 3) return 0.1;
		if (mealCount >= 2) return 0.05;
		return 0;
	};

	const { bundleDiscountedTotal, bundleDiscountPercentage, bundleDiscountAmount } = useMemo(() => {
		if (!cart) return { bundleDiscountedTotal: 0, bundleDiscountPercentage: 0, bundleDiscountAmount: 0 };

		const mealCount = cart.meals.length;
		const discountRate = calculateDiscount(mealCount);
		const bundleDiscountAmount = cart.total * discountRate;
		const bundleDiscountedTotal = cart.total - bundleDiscountAmount;

		return {
			bundleDiscountedTotal,
			bundleDiscountPercentage: discountRate * 100,
			bundleDiscountAmount,
		};
	}, [cart]);

	const { finalTotal, couponDiscountAmount, totalDiscountPercentage } = useMemo(() => {
		if (!cart) return { finalTotal: 0, couponDiscountAmount: 0, totalDiscountPercentage: 0 };
	
		let subtotalAfterBundleDiscount = bundleDiscountedTotal;
		let couponDiscountAmount = 0;
	
		if (appliedCoupon) {
		  if (appliedCoupon.discountType === 'percentage') {
			couponDiscountAmount = subtotalAfterBundleDiscount * (appliedCoupon.discountAmount / 100);
		  } else {
			couponDiscountAmount = Math.min(appliedCoupon.discountAmount, subtotalAfterBundleDiscount);
		  }
		}
	
		const totalDiscountAmount = bundleDiscountAmount + couponDiscountAmount;
		const finalTotal = Math.max(0, subtotalAfterBundleDiscount - couponDiscountAmount);
		const totalDiscountPercentage = (totalDiscountAmount / cart.total) * 100;
	
		return { 
		  finalTotal, 
		  couponDiscountAmount, 
		  totalDiscountPercentage 
		};
	}, [cart, bundleDiscountedTotal, bundleDiscountAmount, appliedCoupon]);

	const handleApplyCoupon = async (code: string) => {
		try {
			console.log('Applying coupon:', code);
			const couponResult = await validateCoupon(code);
			console.log('Coupon validation result:', couponResult);
			if (couponResult.success && couponResult.data) {
				setAppliedCoupon(couponResult.data);
				toast.success('Coupon applied successfully!');
				setCouponCode('');
			} else {
				toast.error(couponResult.error || 'Invalid coupon code');
			}
		} catch (error) {
			console.error('Error applying coupon:', error);
			toast.error('Error applying coupon');
		}
	};

	const handleRemoveCoupon = () => {
		setAppliedCoupon(null);
		toast.success('Coupon removed');
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
		const functions = getFunctions();
		const createCheckoutSession = httpsCallable<
			{
				cart: Order;
				bundleDiscount: number;
				couponDiscount: number;
				couponCode?: string;
				successUrl: string;
				cancelUrl: string;
			},
			{ sessionId: string }
		>(functions, 'createCheckoutSession');

		try {
			const bundleDiscount = cart.total - bundleDiscountedTotal;
			const couponDiscount = appliedCoupon
				? appliedCoupon.discountType === 'percentage'
					? bundleDiscountedTotal * (appliedCoupon.discountAmount / 100)
					: appliedCoupon.discountAmount
				: 0;

			const result = await createCheckoutSession({
				cart,
				bundleDiscount,
				couponDiscount,
				couponCode: appliedCoupon?.code,
				successUrl: `${window.location.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
				cancelUrl: `${window.location.origin}/checkout`,
			});

			const { sessionId } = result.data;

			if (sessionId) {
				const stripe = await stripePromise;
				const { error } = await stripe!.redirectToCheckout({ sessionId });

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
			<h1 className="text-2xl font-bold mb-3">Checkout</h1>

			<DiscountMessage
				mealCount={cart.meals.length}
				currentDiscount={totalDiscountPercentage}
			/>

			<div className="space-y-6 mt-3">
				{cart.meals.map((meal) => (
					<div
						key={meal.id}
						className="bg-white border p-4 rounded-md shadow-sm"
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
			<div className="my-8 border-t pt-6">
				<div className="space-y-2 mb-4">
					<div className="flex justify-between items-center">
						<p className="text-lg">Subtotal:</p>
						<p className="text-lg">${cart.total.toFixed(2)}</p>
					</div>
					{bundleDiscountPercentage > 0 && (
						<div className="flex justify-between items-center text-green-600">
							<p>Bundle Discount ({bundleDiscountPercentage}%):</p>
							<p>-${(cart.total - bundleDiscountedTotal).toFixed(2)}</p>
						</div>
					)}
					{appliedCoupon && (
						<div className="flex justify-between items-center text-green-600">
							<p>Coupon Discount ({appliedCoupon.code}):</p>
							<p>-${(bundleDiscountedTotal - finalTotal).toFixed(2)}</p>
						</div>
					)}
					<div className="flex justify-between items-center font-bold text-xl">
						<p>Total:</p>
						<p>${finalTotal.toFixed(2)}</p>
					</div>
				</div>
				{appliedCoupon ? (
					<div className="flex justify-between items-center mt-4 mb-4">
						<p>Applied Coupon: {appliedCoupon.code}</p>
						<Button
							variant="outline"
							size="sm"
							onClick={handleRemoveCoupon}
						>
							Remove Coupon
						</Button>
					</div>
				) : (
					<div className="flex space-x-2 mt-4 mb-4">
						<Input
							className="bg-white"
							placeholder="Enter coupon code"
							value={couponCode}
							onChange={(e) => setCouponCode(e.target.value)}
						/>
						<Button variant={'outline'} onClick={() => handleApplyCoupon(couponCode)}>Apply Coupon</Button>
					</div>
				)}
				<Button
					onClick={handleCheckout}
					className="w-full sm:w-auto sm:min-w-[200px] sm:float-right"
					disabled={isProcessing}
				>
					{isProcessing ? 'Processing...' : 'Proceed to Payment'}
				</Button>
			</div>
		</div>
	);
};

export default CheckoutPage;
