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

const OrderSuccessPage: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const { state, dispatch } = useAppContext();
	const [orderSummary, setOrderSummary] = useState<OrderHistorySummary | null>(null);
	const [mealSummary, setMealSummary] = useState<Meal[] | undefined>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const queryParams = new URLSearchParams(location.search);
		const session_id = queryParams.get('session_id');

		if (session_id && state.cart) {
			const saveOrderToDb = async () => {
				const functions = getFunctions();
				const saveOrder = httpsCallable<{ order: Order; sessionId: string }, SaveOrderResponse>(
					functions,
					'saveOrder'
				);

				try {
					const result: HttpsCallableResult<SaveOrderResponse> = await saveOrder({
						order: state.cart as Order,
						sessionId: session_id,
					});

					const { orderId, customOrderNumber } = result.data;
					console.log('Order saved:', orderId, customOrderNumber);

					const updatedOrder = {
						...state.cart,
						orderId: orderId,
						customOrderNumber,
						status: 'paid',
						createdAt: new Date().toISOString(),
						items: state.cart?.meals.length ?? 0,
						originalTotal: state.cart?.total ?? 0,
						total: result.data.finalTotal,
					};

					setMealSummary(state.cart?.meals);
					setOrderSummary(updatedOrder);

					// Dispatch action to update user's order history
					dispatch({
						type: 'CONFIRM_ORDER',
						payload: updatedOrder,
					});

					// Clear the cart
					dispatch({ type: 'CLEAR_CART' });

					setIsLoading(false);
					toast.success('Order placed successfully!');
				} catch (error) {
					console.error('Error saving order:', error);
					toast.error('There was an error processing your order. Please contact support.');
					setIsLoading(false);
				}
			};

			saveOrderToDb();
		} else if (!session_id) {
			// Redirect to home if there's no session_id
			navigate('/');
		}
	}, [location, state.cart, dispatch, navigate]);

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
				case 1:
					return 'st';
				case 2:
					return 'nd';
				case 3:
					return 'rd';
				default:
					return 'th';
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
					<div
						className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6"
						role="alert"
					>
						<p className="font-bold">Thank you so much for your order!</p>
						<p>We've received your order details!</p>
					</div>
					<h2 className="text-xl font-semibold mb-4">Order Summary</h2>
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
