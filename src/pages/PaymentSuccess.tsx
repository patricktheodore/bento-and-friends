import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

const PaymentSuccessPage = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { dispatch } = useAppContext();
	const [status, setStatus] = useState<'loading' | 'success' | 'already-processed'>('loading');

	useEffect(() => {
		const sessionId = searchParams.get('session_id');

		if (!sessionId) {
			navigate('/');
			return;
		}

		// Check if we've already processed this session
		const processedSessions = JSON.parse(localStorage.getItem('processedSessions') || '[]');

		if (processedSessions.includes(sessionId)) {
			setStatus('already-processed');
			// Clear cart since payment was successful
			dispatch({ type: 'CLEAR_CART' });
			return;
		}

		// Mark this session as processed
		processedSessions.push(sessionId);
		localStorage.setItem('processedSessions', JSON.stringify(processedSessions));

		// Clear the cart
		dispatch({ type: 'CLEAR_CART' });

		setStatus('success');

	}, [searchParams, navigate, dispatch]);

	if (status === 'loading') {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
					<p className="mt-4 text-gray-600">Processing your order...</p>
				</div>
			</div>
		);
	}

	if (status === 'already-processed') {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
					<AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
					<h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Already Processed</h1>
					<p className="text-gray-600 mb-6">
						This payment has already been processed. You can view your order history in your account.
					</p>
					<button
						onClick={() => navigate('/account')}
						className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
						View Orders
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
				<div className="text-center">
					<CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
					<h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
					<p className="text-gray-600 mb-6">
						Thank you for your order. You'll receive a confirmation email shortly with your order details.
					</p>

					<div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
						<p className="text-sm text-blue-800">
							<strong>Note:</strong> Your order is being processed. It may take a few moments to appear in
							your order history.
						</p>
					</div>

					<div className="space-y-3">
						<button
							onClick={() => navigate('/account?tab=orders')}
							className="w-full bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
							View Order History
						</button>
						<button
							onClick={() => navigate('/order')}
							className="w-full bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors">
							Make Another Order
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PaymentSuccessPage;
