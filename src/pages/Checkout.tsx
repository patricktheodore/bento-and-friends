import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ChevronLeft, Edit, Trash2, Loader2, CheckCircle, XCircle, ShoppingCart, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Meal } from '@/models/order.model';
import { loadStripe } from '@stripe/stripe-js';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Coupon } from '@/models/user.model';
import { validateCoupon } from '@/services/coupon-service';
import { Input } from '@/components/ui/input';
import DiscountMessage from '../components/DiscountMessage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { calculateDiscounts } from '@/utils/calculate-discount';
import { isValidDateCheck } from '@/utils/dateValidation';
import OrderDialog from '@/components/OrderDialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const stripePromise = loadStripe(
	'pk_test_51RbbwMRtsoGEFZInbGrxGhn8cPi6bAX35Hqjj1dr6tx22Vsfaxm3aBNdDXGp1Si9VxuCzwjWEWjCKpEgGzlpU4Jo00VRwsQajl'
);

type CheckoutStep = 'review' | 'payment' | 'processing' | 'success' | 'error';

const CheckoutPage: React.FC = () => {
	const { state, dispatch } = useAppContext();
	const { cart, user } = state;

	const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
    const [showOrderDialog, setShowOrderDialog] = useState(false);
	const [couponCode, setCouponCode] = useState('');
	const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
	const [clientSecret, setClientSecret] = useState('');
	const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
	const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
	const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('review');
	const [paymentError, setPaymentError] = useState<string | null>(null);

	// Check for existing order on mount
	useEffect(() => {
		const savedOrderId = localStorage.getItem('currentOrderId');
		const savedClientSecret = localStorage.getItem('clientSecret');
		
		if (savedOrderId && savedClientSecret) {
			setCurrentOrderId(savedOrderId);
			setClientSecret(savedClientSecret);
			setCheckoutStep('payment');
		}
	}, []);

	// Sort meals by delivery date (earliest first)
	const sortedMeals = useMemo(() => {
		if (!cart?.meals) return [];
		
		return [...cart.meals].sort((a, b) => {
			const dateA = new Date(a.deliveryDate);
			const dateB = new Date(b.deliveryDate);
			return dateA.getTime() - dateB.getTime();
		});
	}, [cart?.meals]);

	const discountCalculation = useMemo(() => {
		return calculateDiscounts(cart, appliedCoupon);
	}, [cart, appliedCoupon]);

	const {
		bundleDiscountAmount,
		bundleDiscountPercentage,
		bundleDiscountedTotal,
		couponDiscountAmount,
		finalTotal,
		totalDiscountPercentage,
	} = discountCalculation;

	const hasInvalidDates = useMemo(() => {
		return sortedMeals.some(meal => !isValidDateCheck(new Date(meal.deliveryDate), meal.school?.validDates));
	}, [sortedMeals]);

	const handleApplyCoupon = async (code: string) => {
		try {
			const couponResult = await validateCoupon(code);

			if (couponResult.success && couponResult.data) {
				setAppliedCoupon(couponResult.data);
				toast.success('Coupon applied successfully!');
				setCouponCode('');
			} else {
				toast.error(couponResult.error || 'Invalid coupon code');
			}
		} catch (error) {
			toast.error('Error applying coupon');
		}
	};

	const handleRemoveCoupon = () => {
		setAppliedCoupon(null);
		toast.success('Coupon removed');
	};

    const editMeal = (meal: Meal) => {
        setSelectedMeal(meal);
        setShowOrderDialog(true);
    };

    const handleCloseModal = () => {
        setShowOrderDialog(false);
        setSelectedMeal(null);
    };

	const removeMeal = (mealId: string) => {
		dispatch({ type: 'REMOVE_FROM_CART', payload: mealId });
		toast.success('Item removed from cart');
	};

    const isInvalidDate = (meal: Meal): boolean => {
        return !(isValidDateCheck(new Date(meal.deliveryDate), meal.school?.validDates));
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
		if (!cart || !state.cart || !cart.meals || cart.meals.length === 0) return;
		if (hasInvalidDates) {
			toast.error('Please fix invalid delivery dates before proceeding');
			return;
		}

		setIsCheckoutLoading(true);
		setCheckoutStep('processing');
		setPaymentError(null);

		try {
			localStorage.setItem('cart', JSON.stringify(cart));

			const functions = getFunctions();
			const createCheckoutSession = httpsCallable(functions, 'createCheckout');

            const lineItems = cart.meals.map((meal) => ({
                price_data: {
                    currency: 'aud',
                    product_data: {
                        name: `${meal.main.display} - ${meal.child.name}`,
                        description: `Main: ${meal.main.display}, For: ${meal.child.name} (${meal.school.name}), On: ${new Date(meal.deliveryDate).toLocaleDateString('en-AU')}`,
                    },
                    unit_amount: Math.round(meal.total * 100), // Convert to cents
                },
                quantity: 1,
            }));

			const result = await createCheckoutSession({
				lineItems,
				returnUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
				customerId: user?.displayName ?? user?.id,
				customerEmail: user?.email,
				couponCode: appliedCoupon ? appliedCoupon.code : null,
				discountAmount: Math.round((bundleDiscountAmount + couponDiscountAmount) * 100), // Convert to cents
				cartData: cart,
			});

			const { clientSecret, orderId } = result.data as {
				clientSecret: string;
				orderId: string;
			};

			setCurrentOrderId(orderId);
			localStorage.setItem('currentOrderId', orderId);
			localStorage.setItem('clientSecret', clientSecret);

			setClientSecret(clientSecret);
			setCheckoutStep('payment');
		} catch (error) {
			console.error('Checkout Error:', error);
			setPaymentError('An error occurred during checkout. Please try again.');
			setCheckoutStep('error');
			toast.error('An error occurred during checkout. Please try again.');
		} finally {
			setIsCheckoutLoading(false);
		}
	};

	const handleBackToReview = () => {
		setCheckoutStep('review');
		setPaymentError(null);
	};

	const handleRetryCheckout = () => {
		setPaymentError(null);
		setCheckoutStep('review');
		// Clear stored checkout data
		localStorage.removeItem('currentOrderId');
		localStorage.removeItem('clientSecret');
		setCurrentOrderId(null);
		setClientSecret('');
	};

	// Callback for EmbeddedCheckoutProvider
	const fetchClientSecret = useCallback(() => {
		return Promise.resolve(clientSecret);
	}, [clientSecret]);

	const options = {
		fetchClientSecret,
	};

	if (!cart || cart.meals.length === 0) {
		return (
			<div className="container mx-auto p-4 py-8">
				<Card>
					<CardHeader>
						<CardTitle className="text-2xl font-bold text-center">Your Cart is Empty</CardTitle>
					</CardHeader>
					<CardContent className="text-center">
						<div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
							<ShoppingCart className="h-8 w-8 text-gray-400" />
						</div>
						<p className="text-gray-600 mb-6">Add some delicious meals to your cart before checking out.</p>
						<Button onClick={() => window.history.back()} className="bg-blue-600 text-white hover:bg-blue-700">
							Continue Shopping
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Success State Component
	const SuccessState = () => (
		<div className="container mx-auto px-4 py-12">
			<Card className="max-w-2xl mx-auto">
				<CardContent className="text-center py-12">
					<div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
						<CheckCircle className="h-12 w-12 text-green-600" />
					</div>
					<h1 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
					<p className="text-gray-600 mb-6">
						Thank you for your order. We've received your payment and will begin preparing your meals.
					</p>
					{currentOrderId && (
						<div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
							<p className="text-sm text-green-800">
								<strong>Order ID:</strong> {currentOrderId}
							</p>
						</div>
					)}
					<div className="space-y-3">
						<Button 
							onClick={() => window.location.href = '/orders'} 
							className="w-full sm:w-auto"
						>
							View Order History
						</Button>
						<Button 
							variant="outline" 
							onClick={() => window.location.href = '/order'}
							className="w-full sm:w-auto ml-0 sm:ml-3"
						>
							Place Another Order
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);

	// Error State Component
	const ErrorState = () => (
		<div className="container mx-auto px-4 py-12">
			<Card className="max-w-2xl mx-auto">
				<CardContent className="text-center py-12">
					<div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
						<XCircle className="h-12 w-12 text-red-600" />
					</div>
					<h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Failed</h1>
					<p className="text-gray-600 mb-4">
						{paymentError || 'There was an issue processing your payment. Please try again.'}
					</p>
					<div className="space-y-3">
						<Button 
							onClick={handleRetryCheckout}
							className="w-full sm:w-auto"
						>
							Try Again
						</Button>
						<Button 
							variant="outline" 
							onClick={() => window.location.href = '/order'}
							className="w-full sm:w-auto ml-0 sm:ml-3"
						>
							Back to Ordering
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);

	// Processing State Component
	const ProcessingState = () => (
		<div className="container mx-auto px-4 py-12">
			<Card className="max-w-2xl mx-auto">
				<CardContent className="text-center py-12">
					<div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
						<Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
					</div>
					<h1 className="text-3xl font-bold text-gray-900 mb-4">Setting Up Your Order</h1>
					<p className="text-gray-600 mb-6">
						Please wait while we prepare your checkout session...
					</p>
				</CardContent>
			</Card>
		</div>
	);

	// Render the order summary component
	const OrderSummary = () => (
		<div className="flex-1 min-w-0">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">
					{checkoutStep === 'payment' ? 'Order Summary' : 'Checkout'}
				</h1>
				{checkoutStep === 'payment' && (
					<Badge variant="outline" className="bg-blue-50 text-blue-700">
						Step 2 of 2
					</Badge>
				)}
			</div>

			{checkoutStep === 'review' && (
				<DiscountMessage
					mealCount={cart.meals.length}
					currentDiscount={totalDiscountPercentage}
				/>
			)}

			{hasInvalidDates && checkoutStep === 'review' && (
				<Alert variant="destructive" className="mb-6">
					<AlertTriangle className="h-4 w-4" />
					<AlertDescription>
						Some meals have invalid delivery dates. Please fix these before proceeding with checkout.
					</AlertDescription>
				</Alert>
			)}

			<div className="space-y-6 mt-3">
				{sortedMeals.map((meal) => (
					<Card key={meal.id} className="shadow-sm">
						<CardContent className="p-4">
							<div className="flex flex-wrap justify-between items-start">
								<div className="w-full sm:w-2/3">
									<h3 className="font-semibold text-lg">{meal.main.display}</h3>
									{isInvalidDate(meal) && (
										<Alert variant="destructive" className="mt-2 mb-2">
											<AlertTriangle className="h-4 w-4" />
											<AlertDescription>
												This meal's delivery date is invalid. Either it has passed, or the school does not offer service for this date. Please update or remove it.
											</AlertDescription>
										</Alert>
									)}
									<p className="text-sm text-gray-600 mt-1">
										<strong>Details: </strong>
										{meal.addOns.map((addon) => addon.display).join(', ')} -{' '}
										{meal.side ? meal.side.display : ' No side '} -{' '}
										{meal.fruit ? meal.fruit.display : ' No fruit '}
									</p>
									<p className="text-sm text-gray-600">
										<strong>For:</strong> {meal.child.name}
									</p>
									<p className='text-sm text-gray-600'>
										<strong>Delivered to: </strong> {meal.school.name}
									</p>
									<p className='text-sm text-gray-600'>
										<strong>Delivery date: </strong> {new Date(meal.deliveryDate).toLocaleDateString()}
									</p>
								</div>
								<div className="w-full sm:w-1/3 mt-2 sm:mt-0 text-right">
									<p className="text-lg font-medium text-green-600">${meal.total.toFixed(2)}</p>
								</div>
							</div>

							{checkoutStep === 'review' && (
								<div className='mt-4 flex justify-start items-center gap-2'>
									<Button
										variant="outline"
										size="sm"
										onClick={() => editMeal(meal)}
										disabled={isCheckoutLoading}>
										<Edit className="h-4 w-4 mr-2" /> Edit
									</Button>
									<Button
										variant="destructive"
										size="sm"
										onClick={() => removeMeal(meal.id)}
										disabled={isCheckoutLoading}>
										<Trash2 className="h-4 w-4 mr-2" /> Remove
									</Button>
								</div>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			{/* Pricing Summary */}
			<Card className="mt-8">
				<CardContent className="p-6">
					<h3 className="font-semibold text-lg mb-4">Order Total</h3>
					<div className="space-y-3">
						<div className="flex justify-between items-center">
							<p className="text-base">Subtotal:</p>
							<p className="text-base">${cart.total.toFixed(2)}</p>
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
						<div className="border-t pt-3">
							<div className="flex justify-between items-center font-bold text-xl">
								<p>Total:</p>
								<p className="text-green-600">${finalTotal.toFixed(2)}</p>
							</div>
						</div>
					</div>

					{checkoutStep === 'review' && (
						<div className="mt-6">
							{appliedCoupon ? (
								<div className="flex justify-between items-center mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
									<p className="text-green-800">Applied Coupon: <strong>{appliedCoupon.code}</strong></p>
									<Button
										variant="outline"
										size="sm"
										onClick={handleRemoveCoupon}
										disabled={isCheckoutLoading}>
										Remove
									</Button>
								</div>
							) : (
								<div className="flex space-x-2 mb-4">
									<Input
										className="bg-white"
										placeholder="Enter coupon code"
										value={couponCode}
										onChange={(e) => setCouponCode(e.target.value)}
										disabled={isCheckoutLoading}
									/>
									<Button
										variant={'outline'}
										onClick={() => handleApplyCoupon(couponCode)}
										disabled={isCheckoutLoading || !couponCode.trim()}>
										Apply
									</Button>
								</div>
							)}
							<Button
								onClick={handleCheckout}
								disabled={isCheckoutLoading || hasInvalidDates}
								className="w-full">
								{isCheckoutLoading ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Setting up payment...
									</>
								) : (
									<>
										<CreditCard className="h-4 w-4 mr-2" />
										Proceed to Payment
									</>
								)}
							</Button>
						</div>
					)}

					{/* Show order ID when in payment mode */}
					{checkoutStep === 'payment' && currentOrderId && (
						<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
							<p className="text-sm text-blue-800">
								<strong>Order ID:</strong> {currentOrderId}
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);

	// Render different states based on checkout step
	if (checkoutStep === 'success') {
		return <SuccessState />;
	}

	if (checkoutStep === 'error') {
		return <ErrorState />;
	}

	if (checkoutStep === 'processing') {
		return <ProcessingState />;
	}

	return (
		<div className="container mx-auto px-4 py-12">
			{checkoutStep === 'payment' && clientSecret ? (
				<>
					<div className='w-full flex justify-between items-center mb-6'>
						<h2 className="text-2xl font-bold flex items-center gap-2">
							<CreditCard className="h-6 w-6" />
							Complete Payment
						</h2>
						<Button
							variant="outline"
							onClick={handleBackToReview}>
							<ChevronLeft className="h-4 w-4 mr-1" /> Back to Review
						</Button>
					</div>
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						<div className="lg:col-span-2">
							<Card className="overflow-hidden">
								<CardContent className="pb-8 bg-brand-dark-green">
									<EmbeddedCheckoutProvider
										stripe={stripePromise}
										options={options}>
										<EmbeddedCheckout />
									</EmbeddedCheckoutProvider>
								</CardContent>
							</Card>
						</div>
						<div className="lg:col-span-1">
							<OrderSummary />
						</div>
					</div>
				</>
			) : (
				<div className="max-w-4xl mx-auto">
					<OrderSummary />
				</div>
			)}

			{/* Order Dialog */}
			{showOrderDialog && selectedMeal && (
				<OrderDialog
					key={`${selectedMeal?.id}-dialog`}
					isOpen={showOrderDialog}
					onClose={handleCloseModal}
					editingMeal={selectedMeal}
					onSave={handleUpdate}
				/>
			)}
		</div>
	);
};

export default CheckoutPage;