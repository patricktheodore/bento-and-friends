import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from 'react-hot-toast';
import { Order } from '@/models/order.model';

const OrderSuccessPage: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const { state, dispatch } = useAppContext();
	const [orderSummary, setOrderSummary] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const queryParams = new URLSearchParams(location.search);
		const session_id = queryParams.get('session_id');

		if (session_id && state.cart) {
			const saveOrderToDb = async () => {
				const functions = getFunctions();
				const saveOrder = httpsCallable(functions, 'saveOrder');

				try {
					const result = await saveOrder({
						order: state.cart,
						sessionId: session_id,
					});

					setOrderSummary(state.cart as Order);

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

	if (isLoading) {
        return <div>Processing your order...</div>;
    }

	return (
        <>
            {orderSummary &&  (

                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <h1 className="text-2xl font-bold mb-6">Order Successful!</h1>
                    <div
                        className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6"
                        role="alert"
                    >
                        <p className="font-bold">Thank you for your order.</p>
                        <p>We've received your payment and are processing your order.</p>
                    </div>
                    <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                    <div className="space-y-4">
                        {orderSummary.meals.map((meal, index) => (
                            <div
                                key={index}
                                className="border p-4 rounded-md shadow-sm"
                            >
                                <h3 className="font-semibold">{meal.main.display}</h3>
                                <p className="text-sm text-gray-500">{meal.addOns.map((addon) => addon.display).join(', ')}</p>
                                <p className="text-sm">
                                    {meal.child.name} - {new Date(meal.orderDate).toLocaleDateString()}
                                </p>
                                <p className="text-sm font-medium mt-2">${meal.total.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 text-right">
                        <p className="text-xl font-bold">Total: ${orderSummary.total.toFixed(2)}</p>
                    </div>
                </div>
            )}
        </>
	);
};

export default OrderSuccessPage;
