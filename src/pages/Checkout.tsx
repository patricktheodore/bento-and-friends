import React, { useCallback, useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ChevronLeft, Edit, Trash2, Loader2 } from 'lucide-react';
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

const stripePromise = loadStripe(
	'pk_test_51RbbwMRtsoGEFZInbGrxGhn8cPi6bAX35Hqjj1dr6tx22Vsfaxm3aBNdDXGp1Si9VxuCzwjWEWjCKpEgGzlpU4Jo00VRwsQajl'
);

const CheckoutPage: React.FC = () => {
	const { state, dispatch } = useAppContext();
	const { cart, user } = state;

	const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
    const [showOrderDialog, setShowOrderDialog] = useState(false);
	const [couponCode, setCouponCode] = useState('');
	const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
	const [clientSecret, setClientSecret] = useState('');
	const [showEmbeddedCheckout, setShowEmbeddedCheckout] = useState(false);
	const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
	const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

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

    const isInvalidDate = (meal: Meal):boolean => {
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

		setIsCheckoutLoading(true);

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

			setClientSecret(clientSecret);
			setShowEmbeddedCheckout(true);
		} catch (error) {
			console.error('Checkout Error:', error);
			toast.error('An error occurred during checkout. Please try again.');
		} finally {
			setIsCheckoutLoading(false);
		}
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
				<h1 className="text-4xl font-bold mb-6">Checkout</h1>
				<p>Your cart is empty. Please add items to your cart before checking out.</p>
			</div>
		);
	}

	// Render the order summary component
	const OrderSummary = () => (
		<div className="flex-1 min-w-0">
			<h1 className="text-2xl font-bold mb-3">{showEmbeddedCheckout ? 'Order Summary' : 'Checkout'}</h1>

			{!showEmbeddedCheckout && (
				<DiscountMessage
					mealCount={cart.meals.length}
					currentDiscount={totalDiscountPercentage}
				/>
			)}

			<div className="space-y-6 mt-3">
				{sortedMeals.map((meal) => (
					<div
						key={meal.id}
						className="bg-white border p-4 rounded-md shadow-sm">
						<div className="flex flex-wrap justify-between items-start">
							<div className="w-full sm:w-2/3">
								<h3 className="font-semibold text-lg">{meal.main.display}</h3>
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
								<p className="text-sm">
                                    <strong>Details: </strong>
									{meal.addOns.map((addon) => addon.display).join(', ')} -{' '}
									{meal.side ? meal.side.display : ' No side '} -{' '}
									{meal.fruit ? meal.fruit.display : ' No fruit '}
								</p>
								<p className="text-sm">
									<strong>For:</strong> {meal.child.name}
								</p>
                                <p className='text-sm'>
                                    <strong>Delivered to: </strong> {meal.school.name}
                                </p>
                                <p className='text-sm'>
                                    <strong>Delivery date: </strong> {new Date(meal.deliveryDate).toLocaleDateString()}
                                </p>
							</div>
							<div className="w-full sm:w-1/3 mt-2 sm:mt-0 text-right">
								<p className="text-lg font-medium">${meal.total.toFixed(2)}</p>
							</div>
						</div>

                        <div className='mt-2 flex justify-start items-center gap-2'>
                            <Button
                                variant="default"
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

                        {showOrderDialog && (
                            <OrderDialog
                                key={`${selectedMeal?.id}-dialog`}
                                isOpen={showOrderDialog}
                                onClose={handleCloseModal}
                                editingMeal={selectedMeal}
                                onSave={handleUpdate}
                            />
                        )}

					</div>
				))}
			</div>

			{/* Pricing Summary */}
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

				{!showEmbeddedCheckout && (
					<>
						{appliedCoupon ? (
							<div className="flex justify-between items-center mt-4 mb-4">
								<p>Applied Coupon: {appliedCoupon.code}</p>
								<Button
									variant="outline"
									size="sm"
									onClick={handleRemoveCoupon}
									disabled={isCheckoutLoading}>
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
									disabled={isCheckoutLoading}
								/>
								<Button
									variant={'outline'}
									onClick={() => handleApplyCoupon(couponCode)}
									disabled={isCheckoutLoading || !couponCode.trim()}>
									Apply Coupon
								</Button>
							</div>
						)}
						<Button
							onClick={handleCheckout}
							disabled={isCheckoutLoading}
							className="w-full sm:w-auto sm:min-w-[200px] sm:float-right">
							{isCheckoutLoading ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Processing...
								</>
							) : (
								'Proceed to Payment'
							)}
						</Button>
					</>
				)}

				{/* Show order ID when in checkout mode */}
				{showEmbeddedCheckout && currentOrderId && (
					<div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
						<p className="text-sm text-green-800">
							<strong>Order ID:</strong> {currentOrderId}
						</p>
					</div>
				)}
			</div>
		</div>
	);

	return (
		<div className="container mx-auto px-4 py-12">
			{showEmbeddedCheckout && clientSecret ? (
				<>
                    <div className='w-full flex justify-between items-center'>
					    <h2 className="text-2xl font-bold mb-4">Payment</h2>
                        <Button
                            variant="outline"
                            className="mb-4"
                            onClick={() => setShowEmbeddedCheckout(false)}>
                            <ChevronLeft className="h-4 w-4 mr-1" /> Go Back
                        </Button>
                    </div>
					<div className="bg-brand-dark-green py-12 rounded-lg border shadow-sm overflow-hidden">
						<EmbeddedCheckoutProvider
							stripe={stripePromise}
							options={options}>
							<EmbeddedCheckout />
						</EmbeddedCheckoutProvider>
					</div>
				</>
			) : (
				<div className="max-w-4xl mx-auto">
					<OrderSummary />
				</div>
			)}
		</div>
	);
};

export default CheckoutPage;