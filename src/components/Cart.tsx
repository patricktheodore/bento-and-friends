import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
	'pk_live_51PzenCRuOSdR9YdWStFVzk83YT4PRIeDGCMRCylZObMEVE0Fp24AwPMp0gK91zLvZXNvfhSGNG7vKnetFkg1MWna00flH0J7XX'
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
	const [isMainOnly, setIsMainOnly] = useState<boolean>(false);

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

	const resetProcessingState = useCallback(() => {
		setIsProcessing(false);
	}, []);

	useEffect(() => {
		const handleVisibilityChange = () => {
			if (!document.hidden) {
				resetProcessingState();
			}
		};

		const handlePopState = () => {
			resetProcessingState();
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);
		window.addEventListener('popstate', handlePopState);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('popstate', handlePopState);
		};
	}, [resetProcessingState]);

	useEffect(() => {
		if (!isCartOpen) {
			resetProcessingState();
		}
	}, [isCartOpen, resetProcessingState]);

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

	const closeCart = () => {
		resetProcessingState();
		dispatch({ type: 'TOGGLE_CART' });
	};

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
			// Verify school data is present
			if (!editingMeal.school?.id) {
				const school = state.schools.find((s) => s.name === editingMeal.child.school);

				if (!school) {
					toast.error('Error: School information is missing');
					return;
				}

				// Ensure school data is complete before updating
				editingMeal.school = {
					id: school.id,
					name: school.name,
					address: school.address,
					isActive: school.isActive,
					deliveryDays: school.deliveryDays,
				};
			}

			if (isMainOnly) {
				editingMeal.probiotic = undefined;
				editingMeal.fruit = undefined;
			}

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

	const orderAddOns = (addOns: AddOn[]): AddOn[] => {
		const mainOnly = addOns.find((addon) => addon.display.toLowerCase().includes('main only'));
		if (mainOnly) {
			return [mainOnly, ...addOns.filter((addon) => addon.id !== mainOnly.id)];
		} else {
			return addOns;
		}
	};

	const isValidDate = (date: Date) => {
		const now = new Date();
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const day = date.getDay();
		const isWeekend = day === 0 || day === 6;

		let isPast;
		if (now.getHours() < 7) {
			isPast = date < today;
		} else {
			isPast = date <= today;
		}
		const isBlocked = state.blockedDates.some(
			(blockedDate) => new Date(blockedDate).toDateString() === date.toDateString()
		);
		const schoolDeiveryDays = editingMeal?.school?.deliveryDays.map((day) => day.toLowerCase());
		const schoolDeliversOnDay = schoolDeiveryDays?.includes(
			date.toLocaleString('en-US', { weekday: 'long' }).toLowerCase()
		);

		return isWeekend || isPast || isBlocked || !schoolDeliversOnDay;
	};

	// In Cart.tsx
	const handleCheckout = async () => {
		if (!cart || !state.cart) return;

		const now = new Date();
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const invalidDates = cart.meals.filter((meal) => {
			const orderDate = new Date(meal.orderDate);

			if (now.getHours() < 7) {
				return orderDate < today;
			} else {
				return orderDate <= today;
			}
		});

		if (invalidDates.length > 0) {
			toast.error(
				<div>
					<p>Some meals have invalid delivery dates:</p>
					<ul className="list-disc pl-4 mt-2">
						{invalidDates.map((meal, index) => (
							<li key={index}>
								{meal.child.name} - {formatDate(meal.orderDate)}
							</li>
						))}
					</ul>
					<p className="mt-2">Please update or remove these meals to continue.</p>
				</div>
			);
			return;
		}

		// Validate all meals have complete school data
		const invalidMeals = cart.meals.filter((meal) => !meal.school?.id);
		if (invalidMeals.length > 0) {
			// Try to recover missing school data
			const updatedMeals = cart.meals.map((meal) => {
				if (!meal.school?.id) {
					const school = state.schools.find((s) => s.name === meal.child.school);
					if (school) {
						return {
							...meal,
							school: {
								id: school.id,
								name: school.name,
								address: school.address,
								isActive: school.isActive,
								deliveryDays: school.deliveryDays,
							},
						};
					}
				}
				return meal;
			});

			// Check if recovery was successful
			const stillInvalid = updatedMeals.filter((meal) => !meal.school?.id);
			if (stillInvalid.length > 0) {
				toast.error('Some orders have missing school information. Please try again or contact support.');
				console.error('Invalid meals:', stillInvalid);
				return;
			}

			// Update cart with recovered data
			dispatch({
				type: 'SET_CART',
				payload: {
					...cart,
					meals: updatedMeals,
				},
			});
		}

		setIsProcessing(true);

		try {
			localStorage.setItem('cart', JSON.stringify(cart));
			const stripe = await stripePromise;
			if (!stripe) {
				throw new Error('Stripe failed to initialize');
			}

			const functions = getFunctions();
			const createCheckoutSession = httpsCallable<
				{
					cart: Order;
					bundleDiscount: number;
					couponDiscount: number;
					couponCode?: string;
					couponId?: string;
					successUrl: string;
					cancelUrl: string;
				},
				{ sessionId: string }
			>(functions, 'createCheckoutSession');

			const bundleDiscount = cart.total - bundleDiscountedTotal;
			const couponDiscount = appliedCoupon
				? appliedCoupon.discountType === 'percentage'
					? bundleDiscountedTotal * (appliedCoupon.discountAmount / 100)
					: appliedCoupon.discountAmount
				: 0;

			// Ensure URLs are absolute
			const successUrl = new URL('/order-success', window.location.origin).toString();
			const cancelUrl = new URL('/checkout', window.location.origin).toString();

			const result = await createCheckoutSession({
				cart,
				bundleDiscount,
				couponDiscount,
				couponCode: appliedCoupon?.code,
				couponId: appliedCoupon?.id,
				successUrl: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
				cancelUrl: cancelUrl,
			});

			if (!result?.data?.sessionId) {
				throw new Error('Failed to create checkout session');
			}

			// Redirect to Stripe Checkout
			const { error } = await stripe.redirectToCheckout({
				sessionId: result.data.sessionId,
			});

			if (error) {
				throw error;
			}
		} catch (error) {
			console.error('Checkout Error:', error);
			toast.error('An error occurred during checkout. Please try again.');
			resetProcessingState();
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
						{cart && (
							<DiscountMessage
								mealCount={cart.meals.length}
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

					{cart && cart.meals.length > 0 ? (
						cart.meals.map((meal) => (
							<div
								key={meal.id}
								className="py-4 border-b">
								<h3 className="font-semibold">{meal.main.display}</h3>
								{(() => {
									const now = new Date();
									const today = new Date();
									today.setHours(0, 0, 0, 0);
									const orderDate = new Date(meal.orderDate);

									let isPast;
									if (now.getHours() < 7) {
										isPast = orderDate < today;
									} else {
										isPast = orderDate <= today;
									}

									return isPast;
								})() && (
									<Alert
										variant="destructive"
										className="mt-2 mb-2">
										<AlertTriangle className="h-4 w-4" />
										<AlertDescription>
											This meal's delivery date has passed. Please update or remove it.
										</AlertDescription>
									</Alert>
								)}
								<p className="text-sm text-gray-500">
									{meal.addOns.map((addon) => addon.display).join(', ')} -{' '}
									{meal.probiotic ? meal.probiotic.display : ' No side '} -{' '}
									{meal.fruit ? meal.fruit.display : ' No fruit '}
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
										onOpenChange={setIsDialogOpen}>
										<DialogTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												onClick={() => startEditing(meal)}>
												<Edit2 className="h-4 w-4 mr-1" /> Edit
											</Button>
										</DialogTrigger>
										<DialogContent className="sm:max-w-[425px] max-h-[95vh] overflow-scroll">
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
															}}>
															<SelectTrigger>
																<SelectValue placeholder="Select main dish" />
															</SelectTrigger>
															<SelectContent>
																{state.mains.map((main) => (
																	<SelectItem
																		key={main.id}
																		value={main.id}>
																		{main.display}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</div>

													<div>
														<label className="text-sm font-medium">Add-ons</label>
														{orderAddOns(state.addOns).map(
															(addon) =>
																addon.isActive && (
																	<div
																		key={addon.id}
																		className="flex items-center space-x-2 mb-2">
																		<Checkbox
																			id={addon.id}
																			checked={editingMeal.addOns.some(
																				(a) => a.id === addon.id
																			)}
																			onCheckedChange={(checked) => {
																				setIsMainOnly(
																					checked &&
																						addon.display
																							.toLowerCase()
																							.includes('main only')
																				);
																				handleAddOnToggle(addon.id);
																			}}
																		/>
																		<Label htmlFor={addon.id}>
																			{addon.display}
																		</Label>
																	</div>
																)
														)}
													</div>

													{!isMainOnly && (
														<>
															<div>
																<label className="text-sm font-medium">Side</label>
																<div className="space-y-2">
																	{state.probiotics &&
																		state.probiotics.map(
																			(yogurt) =>
																				yogurt.isActive && (
																					<div
																						key={yogurt.id}
																						className="flex items-center space-x-2">
																						<Checkbox
																							id={`yogurt-${yogurt.id}`}
																							checked={
																								editingMeal.probiotic
																									?.id === yogurt.id
																							}
																							onCheckedChange={(
																								checked
																							) => {
																								setEditingMeal({
																									...editingMeal,
																									probiotic: checked
																										? yogurt
																										: undefined,
																								});
																							}}
																						/>
																						<Label
																							htmlFor={`yogurt-${yogurt.id}`}
																							className="text-sm">
																							{yogurt.display}
																						</Label>
																					</div>
																				)
																		)}
																</div>
															</div>

															<div>
																<label className="text-sm font-medium">Fruit</label>
																<div className="space-y-2">
																	{state.fruits &&
																		state.fruits.map(
																			(fruit) =>
																				fruit.isActive && (
																					<div
																						key={fruit.id}
																						className="flex items-center space-x-2">
																						<Checkbox
																							id={`fruit-${fruit.id}`}
																							checked={
																								editingMeal.fruit
																									?.id === fruit.id
																							}
																							onCheckedChange={(
																								checked
																							) => {
																								setEditingMeal({
																									...editingMeal,
																									fruit: checked
																										? fruit
																										: undefined,
																								});
																							}}
																						/>
																						<Label
																							htmlFor={`fruit-${fruit.id}`}
																							className="text-sm">
																							{fruit.display}
																						</Label>
																					</div>
																				)
																		)}
																</div>
															</div>
														</>
													)}

													<div>
														<label className="text-sm font-medium">Child</label>
														<Select
															value={editingMeal.child.id}
															onValueChange={(value) => {
																const newChild = user?.children.find(
																	(child) => child.id === value
																);
																if (newChild) {
																	const newSchool = state.schools.find(
																		(school) => school.name === newChild.school
																	);

																	if (!newSchool) {
																		console.error(
																			`School not found for child ${newChild.name}`
																		);
																		toast.error(
																			'Error: School information not found'
																		);
																		return;
																	}

																	setEditingMeal({
																		...editingMeal,
																		child: newChild,
																		school: {
																			id: newSchool.id,
																			name: newSchool.name,
																			address: newSchool.address,
																			isActive: newSchool.isActive,
																			deliveryDays: newSchool.deliveryDays,
																		},
																	});
																}
															}}>
															<SelectTrigger>
																<SelectValue placeholder="Select a child" />
															</SelectTrigger>
															<SelectContent>
																{user?.children.map((child) => (
																	<SelectItem
																		key={child.id}
																		value={child.id}>
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
													onClick={cancelEdit}>
													Cancel
												</Button>
												<Button onClick={updateMeal}>Save Changes</Button>
											</DialogFooter>
										</DialogContent>
									</Dialog>
									<Button
										variant="destructive"
										size="sm"
										onClick={() => removeMeal(meal.id)}>
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
					<div className="flex-shrink-0 p-6 pt-2 bg-background border-t">
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
									onClick={handleRemoveCoupon}>
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
											setCouponError(null);
										}}
									/>
									<Button onClick={() => handleApplyCoupon(couponCode)}>Apply</Button>
								</div>
								{couponError && <p className="text-red-600 text-sm">{couponError}</p>}
							</div>
						)}
						<Button
							onClick={handleCheckout}
							className="w-full mt-4"
							disabled={isProcessing}>
							{isProcessing ? 'Processing...' : 'Proceed to Checkout'}
						</Button>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
};

export default Cart;
