import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X, Trash2, Edit2, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Meal, Order } from '@/models/order.model';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AddOn, Main } from '@/models/item.model';
import { toast } from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { getFunctions, httpsCallable } from 'firebase/functions';
import DiscountMessage from './DiscountMessage';
import { Coupon } from '@/models/user.model';
import { Input } from './ui/input';
import { validateCoupon } from '../services/coupon-service';
import { formatDate } from '@/utils/utils';
import { Alert, AlertDescription } from './ui/alert';

const stripePromise = loadStripe(
	'pk_test_51PzenCRuOSdR9YdWK6BbtR2MPhP4jAjNBUPTBg0LGUOJgHmMtL6g90lToUiAoly4VzrXe9BtYVBUoQWR7Bmqa4ND00YsOJX1om'
);

const Cart: React.FC = () => {
	const { state, dispatch } = useAppContext();
	const { cart, isCartOpen, user } = state;
	const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [couponCode, setCouponCode] = useState('');
	const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
	const [duplicateOrders, setDuplicateOrders] = useState<{ childName: string; date: string }[]>([]);
	const [couponError, setCouponError] = useState<string | null>(null);

	const checkDuplicateOrders = useMemo(() => {
		if (!cart) return [];

		const orderMap = new Map<string, Set<string>>();
		const duplicates: { childName: string; date: string }[] = [];

		cart.meals.forEach((meal) => {
			const key = `${meal.child.id}-${meal.orderDate}`;
			if (!orderMap.has(key)) {
				orderMap.set(key, new Set());
			}
			orderMap.get(key)!.add(meal.id);

			if (orderMap.get(key)!.size > 1) {
				duplicates.push({
					childName: meal.child.name,
					date: formatDate(meal.orderDate),
				});
			}
		});

		return duplicates;
	}, [cart]);

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
		if (!cart) return { bundleDiscountedTotal: 0, bundleDiscountPercentage: 0 };

		const mealCount = cart.meals.length;
		const discount = calculateDiscount(mealCount);
		const bundleDiscountedTotal = cart.total * (1 - discount);

		return {
			bundleDiscountedTotal,
			bundleDiscountPercentage: discount * 100,
		};
	}, [cart]);

	const finalTotal = useMemo(() => {
		if (appliedCoupon) {
			if (appliedCoupon.discountType === 'percentage') {
				return bundleDiscountedTotal * (1 - appliedCoupon.discountAmount / 100);
			} else {
				return Math.max(0, bundleDiscountedTotal - appliedCoupon.discountAmount);
			}
		}
		return bundleDiscountedTotal;
	}, [bundleDiscountedTotal, appliedCoupon]);

	const handleApplyCoupon = async (code: string) => {
		try {
			console.log('Applying coupon:', code);
			const couponResult = await validateCoupon(code);
			console.log('Coupon validation result:', couponResult);
			if (couponResult.success && couponResult.data) {
				setAppliedCoupon(couponResult.data);
				toast.success('Coupon applied successfully!');
				setCouponCode('');
				setCouponError(null);
			} else {
				const errorMessage = couponResult.error || 'Invalid coupon code';
				toast.error(errorMessage);
				setCouponError(errorMessage);
			}
		} catch (error) {
			console.error('Error applying coupon:', error);
			const errorMessage = 'Error applying coupon';
			toast.error(errorMessage);
			setCouponError(errorMessage);
		}
	};

	const handleRemoveCoupon = () => {
		setAppliedCoupon(null);
		setCouponError(null);
		toast.success('Coupon removed');
	};

	const calculateDiscountedPrice = (mealPrice: number) => {
		const discount = calculateDiscount(cart?.meals.length || 0);
		return mealPrice * (1 - discount);
	};

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
		const isBlocked = state.blockedDates.some(
			(blockedDate) => new Date(blockedDate).toDateString() === date.toDateString()
		);

		return isWeekend || isPast || isBlocked;
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
				<SheetHeader className="space-y-0 gap-y-2">
					<div className="flex flex-row justify-between items-center">
						<SheetTitle>Your Cart</SheetTitle>
						<Button
							variant="ghost"
							size="icon"
							onClick={closeCart}
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
					{cart && (
						<DiscountMessage
							mealCount={cart.meals.length}
							currentDiscount={bundleDiscountPercentage}
						/>
					)}
				</SheetHeader>

				<ScrollArea className="h-[calc(100vh-22rem)] mt-2">
					{duplicateOrders.length > 0 && (
						<Alert
							variant="destructive"
							className="mt-4"
						>
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
									{meal.child.name} - {formatDate(meal.orderDate)}
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
						<span className="font-semibold text-lg flex justify-between items-center">
							<p>Bundle Discount:</p>
							<p>-${(cart.total - bundleDiscountedTotal).toFixed(2)}</p>
						</span>
						{appliedCoupon && (
							<span className="font-semibold text-lg flex justify-between items-center">
								<p>Coupon Discount:</p>
								<p>-${(bundleDiscountedTotal - finalTotal).toFixed(2)}</p>
							</span>
						)}
						<span className="font-semibold text-lg flex justify-between items-center">
							<p>Total:</p>
							<p>${finalTotal.toFixed(2)}</p>
						</span>
						{appliedCoupon ? (
							<div className="flex justify-between items-center mt-2">
								<p>Applied Coupon: {appliedCoupon.code}</p>
								<Button
									variant="outline"
									size="sm"
									onClick={handleRemoveCoupon}
								>
									Remove
								</Button>
							</div>
						) : (
							<div className="space-y-2 mt-2">
								<div className="flex space-x-2">
									<Input
										placeholder="Enter coupon code"
										value={couponCode}
										onChange={(e) => {
											setCouponCode(e.target.value);
											setCouponError(null); // Clear error when input changes
										}}
									/>
									<Button onClick={() => handleApplyCoupon(couponCode)}>Apply</Button>
								</div>
								{couponError && <p className="text-red-600 text-sm">{couponError}</p>}
							</div>
						)}
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
