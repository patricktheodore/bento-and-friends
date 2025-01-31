import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getFunctions, httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { toast } from 'react-hot-toast';
import { Meal, Order } from '@/models/order.model';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { OrderHistorySummary } from '@/models/user.model';

interface SaveOrderResponse {
    orderId: string;
    customOrderNumber: string;
    finalTotal: number;
}

const dateOptions: Intl.DateTimeFormatOptions = {
	timeZone: "Australia/Perth",
	weekday: "long",
	year: "numeric",
	month: "long",
	day: "numeric"
};

const OrderSuccessPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { dispatch } = useAppContext();
    const [orderSummary, setOrderSummary] = useState<OrderHistorySummary | null>(null);
    const [mealSummary, setMealSummary] = useState<Meal[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const processOrder = async () => {
			try {
				const queryParams = new URLSearchParams(location.search);
				const sessionId = queryParams.get('session_id');

				if (!sessionId) {
					console.error('No session ID found in URL');
					navigate('/');
					return;
				}

				const storedCart = localStorage.getItem('cart');
                if (!storedCart) {
                    console.error('No cart found in storage');
                    navigate('/');
                    return;
                }

				const cart = JSON.parse(storedCart);

                // Only set loading if component is still mounted
                if (isMounted) {
                    setIsLoading(true);
                }

                const functions = getFunctions();
                const saveOrder = httpsCallable<{ order: Order; sessionId: string }, SaveOrderResponse>(
                    functions,
                    'saveOrder'
                );

                const result: HttpsCallableResult<SaveOrderResponse> = await saveOrder({
                    order: cart as Order,
                    sessionId,
                });

                if (!isMounted) return;

                const updatedOrder = {
                    ...cart,
                    orderId: result.data.orderId,
                    customOrderNumber: result.data.customOrderNumber,
                    status: 'paid',
                    createdAt: new Date().toISOString(),
                    items: cart?.meals.length ?? 0,
                    originalTotal: cart?.total ?? 0,
                    total: result.data.finalTotal,
                };

                setMealSummary(cart?.meals || null);
                setOrderSummary(updatedOrder);

                // Fire and forget operations - no need to await
                const updateOrderAnalytics = httpsCallable(functions, 'updateOrderAnalytics');
                updateOrderAnalytics({
                    order: cart,
                    finalTotal: result.data.finalTotal,
                });

				cart.meals.forEach((meal: Meal) => {
					const date = new Date(meal.orderDate);
					meal.orderDate = date.toLocaleDateString("en-AU", dateOptions);
				});

                const sendConfirmation = httpsCallable(functions, 'sendOrderConfirmationEmail');
                sendConfirmation({
                    to: cart.userEmail,
                    customOrderNumber: result.data.customOrderNumber,
                    meals: cart.meals,
                    originalTotal: cart.total,
                    finalTotal: result.data.finalTotal,
                });

                dispatch({ type: 'CLEAR_CART' });
                toast.success('Order placed successfully!');
            } catch (error) {
                if (isMounted) {
                    console.error('Error processing order:', error);
                    toast.error('There was an error processing your order. Please contact support.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        processOrder();

        // Cleanup function to prevent state updates on unmounted component
        return () => {
            isMounted = false;
        };
    }, [location.search, dispatch, navigate]); // Only depend on stable values

    const calculateSavings = (originalTotal: number, finalTotal: number) => {
        return originalTotal - finalTotal;
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' });
        const day = date.getDate();
        const month = date.toLocaleString('en-US', { month: 'long' });

        const getOrdinalSuffix = (d: number) => {
            if (d > 3 && d < 21) return 'th';
            switch (d % 10) {
                case 1: return 'st';
                case 2: return 'nd';
                case 3: return 'rd';
                default: return 'th';
            }
        };

        return `${dayOfWeek} ${day}${getOrdinalSuffix(day)} ${month}`;
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-16 max-w-md">
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center">Processing Your Order</CardTitle>
                        <CardDescription className="text-center">
                            Hang tight while we get everything sorted
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                        <Loader2 className="h-16 w-16 animate-spin text-brand-taupe mb-4" />
                        <p className="text-sm text-gray-500 text-center">
                            We're preparing your meals with care. This won't take long!
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <>
            {orderSummary && (
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <h1 className="text-2xl font-bold mb-6">Order Successful!</h1>
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
                        <p className="font-bold">Thank you for your order!</p>
                        <p>Your order number is: {orderSummary.customOrderNumber}</p>
                        <p>A confirmation email will be sent shortly.</p>
                    </div>
                    <h2 className="text-xl font-semibold mb-4">
                        Order Summary <span> - #{orderSummary.customOrderNumber}</span>
                    </h2>
                    <div className="space-y-4">
                        {mealSummary &&
                            mealSummary.map((meal, index) => (
                                <div
                                    key={index}
                                    className="border p-4 rounded-md bg-white shadow-sm"
                                >
                                    <h3 className="font-semibold">{meal.main.display}</h3>
                                    <p className="text-sm text-gray-500">
                                        {meal.addOns.map((addon) => addon.display).join(', ')}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {meal.probiotic ? meal.probiotic.display : 'No probiotic'} - {meal.fruit ? meal.fruit.display : 'No fruit'}
                                    </p>
                                    <p className="text-sm">
                                        {meal.child.name} - {formatDate(meal.orderDate)}
                                    </p>
                                    <p className="text-sm font-medium mt-2">${meal.total.toFixed(2)}</p>
                                </div>
                            ))}
                    </div>
                    <div className="mt-6 bg-green-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-lg">Original Total:</span>
                            <span className="text-lg line-through">${orderSummary.originalTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-lg font-semibold">Discounted Total:</span>
                            <span className="text-lg font-semibold text-green-600">
                                ${orderSummary.total.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-green-600">
                            <span className="text-lg font-bold">Your Savings:</span>
                            <span className="text-lg font-bold">
                                ${calculateSavings(orderSummary.originalTotal, orderSummary.total).toFixed(2)}
                            </span>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-gray-600 italic">
                        Your savings include bundle discounts and any applied coupons.
                    </p>
                </div>
            )}
        </>
    );
};

export default OrderSuccessPage;