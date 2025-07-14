import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, ShoppingCart, Receipt, Home } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

type PageStatus = 'loading' | 'success' | 'already-processed' | 'error';

const PaymentSuccessPage = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { dispatch, refreshUserData } = useAppContext();
	const [status, setStatus] = useState<PageStatus>('loading');
	const [orderDetails, setOrderDetails] = useState<{
		orderId?: string;
		amount?: string;
		itemCount?: number;
	}>({});
	const hasProcessed = useRef(false);

	useEffect(() => {
		const processPaymentSuccess = async () => {
			// Prevent multiple executions
			if (hasProcessed.current) return;
			
			const sessionId = searchParams.get('session_id');

			if (!sessionId) {
				navigate('/');
				return;
			}

			hasProcessed.current = true;

			try {
				// Check if we've already processed this session
				const processedSessions = JSON.parse(localStorage.getItem('processedSessions') || '[]');

				if (processedSessions.includes(sessionId)) {
					console.log('Session already processed:', sessionId);
					setStatus('already-processed');
					// Clear cart since payment was successful
					dispatch({ type: 'CLEAR_CART' });
					return;
				}

				console.log('Processing new session:', sessionId);

				// Get order details from localStorage if available
				const currentOrderId = localStorage.getItem('currentOrderId');
				const cartData = localStorage.getItem('cart');
				
				let orderDetailsToSet: any = {};
				
				if (currentOrderId) {
					orderDetailsToSet.orderId = currentOrderId;
				}

				if (cartData) {
					try {
						const cart = JSON.parse(cartData);
						orderDetailsToSet.amount = cart.total?.toFixed(2);
						orderDetailsToSet.itemCount = cart.meals?.length || 0;
					} catch (e) {
						console.warn('Could not parse cart data:', e);
					}
				}

				setOrderDetails(orderDetailsToSet);

				// Mark this session as processed BEFORE clearing localStorage
				processedSessions.push(sessionId);
				localStorage.setItem('processedSessions', JSON.stringify(processedSessions));

				// Clear cart and checkout-related localStorage items
				dispatch({ type: 'CLEAR_CART' });
				localStorage.removeItem('cart');
				localStorage.removeItem('currentOrderId');
				localStorage.removeItem('clientSecret');

				// Refresh user data to get updated orders (but don't await it to avoid blocking)
				if (refreshUserData) {
					refreshUserData().catch(console.error);
				}

				setStatus('success');

			} catch (error) {
				console.error('Error processing payment success:', error);
				setStatus('error');
			}
		};

		processPaymentSuccess();
	}, [searchParams, navigate, dispatch]); // Removed refreshUserData from dependencies

	const LoadingState = () => (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<Card className="w-full max-w-md">
				<CardContent className="text-center py-12">
					<div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
						<Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
					</div>
					<h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Your Payment</h2>
					<p className="text-gray-600">Please wait while we confirm your order...</p>
				</CardContent>
			</Card>
		</div>
	);

	const AlreadyProcessedState = () => (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<Card className="w-full max-w-md">
				<CardContent className="text-center py-12">
					<div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
						<AlertCircle className="h-8 w-8 text-yellow-600" />
					</div>
					<h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Already Processed</h1>
					<p className="text-gray-600 mb-6">
						This payment has already been processed. You can view your order history in your account.
					</p>
					
					<Alert className="mb-6 text-left">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							If you're seeing this page unexpectedly, your order was still successful. Check your email for confirmation.
						</AlertDescription>
					</Alert>

					<div className="space-y-3">
						<Button 
							onClick={() => navigate('/orders')} 
							className="w-full"
						>
							<Receipt className="h-4 w-4 mr-2" />
							View Order History
						</Button>
						<Button 
							variant="outline" 
							onClick={() => navigate('/')}
							className="w-full"
						>
							<Home className="h-4 w-4 mr-2" />
							Back to Home
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);

	const ErrorState = () => (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<Card className="w-full max-w-md">
				<CardContent className="text-center py-12">
					<div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
						<AlertCircle className="h-8 w-8 text-red-600" />
					</div>
					<h1 className="text-2xl font-bold text-gray-900 mb-2">Something Went Wrong</h1>
					<p className="text-gray-600 mb-6">
						We encountered an issue processing your payment confirmation. Don't worry - if your payment went through, your order is safe.
					</p>
					
					<Alert variant="destructive" className="mb-6 text-left">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							Check your email for a payment confirmation. If you received one, your order was successful.
						</AlertDescription>
					</Alert>

					<div className="space-y-3">
						<Button 
							onClick={() => navigate('/orders')} 
							className="w-full"
						>
							Check Order History
						</Button>
						<Button 
							variant="outline" 
							onClick={() => navigate('/order')}
							className="w-full"
						>
							Place New Order
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);

	const SuccessState = () => (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
			<Card className="w-full max-w-2xl">
				<CardContent className="text-center py-12">
					{/* Success Icon */}
					<div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
						<CheckCircle className="h-12 w-12 text-green-600" />
					</div>

					{/* Main Success Message */}
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
					<p className="text-lg text-gray-600 mb-8">
						Thank you for your order. We've received your payment and will begin preparing your meals.
					</p>

					{/* Order Details */}
					{(orderDetails.orderId || orderDetails.amount || orderDetails.itemCount) && (
						<div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
							<h3 className="font-semibold text-green-800 mb-4">Order Details</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
								{orderDetails.orderId && (
									<div>
										<span className="block text-green-600 font-medium">Order ID</span>
										<span className="text-green-800">{orderDetails.orderId}</span>
									</div>
								)}
								{orderDetails.itemCount && (
									<div>
										<span className="block text-green-600 font-medium">Items</span>
										<span className="text-green-800">{orderDetails.itemCount} meals</span>
									</div>
								)}
								{orderDetails.amount && (
									<div>
										<span className="block text-green-600 font-medium">Total Paid</span>
										<span className="text-green-800">${orderDetails.amount}</span>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Information Alert */}
					<Alert className="mb-8 text-left">
						<CheckCircle className="h-4 w-4" />
						<AlertDescription>
							<strong>What happens next?</strong><br />
							• You'll receive a confirmation email shortly<br />
							• Your order will appear in your order history<br />
							• We'll prepare and deliver your meals on the scheduled dates
						</AlertDescription>
					</Alert>

					{/* Action Buttons */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Button 
							onClick={() => navigate('/account')} 
							className="w-full"
							size="lg"
						>
							<Receipt className="h-5 w-5 mr-2" />
							View Order History
						</Button>
						<Button 
							variant="outline" 
							onClick={() => navigate('/order')}
							className="w-full"
							size="lg"
						>
							<ShoppingCart className="h-5 w-5 mr-2" />
							Order More Meals
						</Button>
					</div>

					{/* Secondary Actions */}
					<div className="mt-6 pt-6 border-t">
						<p className="text-sm text-gray-500 mb-4">
							Need help with your order?
						</p>
						<div className="flex justify-center space-x-4">
							<Button 
								variant="ghost" 
								size="sm"
								onClick={() => navigate('/contact')}
							>
								Contact Support
							</Button>
							<Button 
								variant="ghost" 
								size="sm"
								onClick={() => navigate('/')}
							>
								<Home className="h-4 w-4 mr-1" />
								Back to Home
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);

	// Render appropriate state
	switch (status) {
		case 'loading':
			return <LoadingState />;
		case 'already-processed':
			return <AlreadyProcessedState />;
		case 'error':
			return <ErrorState />;
		case 'success':
		default:
			return <SuccessState />;
	}
};

export default PaymentSuccessPage;