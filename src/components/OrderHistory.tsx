import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Order, Meal } from '../models/order.model';
import { OrderHistorySummary } from '../models/user.model';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp, Loader2, Utensils } from 'lucide-react';
import { fetchOrderDetails } from '../services/user-service';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar } from './ui/calendar';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

const OrderHistory: React.FC = () => {
	const { state, dispatch } = useAppContext();
	const navigate = useNavigate();
	const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
	const [expandedOrderDetails, setExpandedOrderDetails] = useState<Order | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
	const [isOrderAgainDialogOpen, setIsOrderAgainDialogOpen] = useState(false);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const [orderAgainStep, setOrderAgainStep] = useState(1);

	const handleOrderClick = async (orderSummary: OrderHistorySummary) => {
		if (expandedOrderId === orderSummary.orderId) {
			setExpandedOrderId(null);
			setExpandedOrderDetails(null);
		} else {
			setIsLoading(true);
			setExpandedOrderId(orderSummary.orderId);
			try {
				const orderDetails = await fetchOrderDetails(orderSummary.orderId);
				setExpandedOrderDetails(orderDetails);
			} catch (error) {
				console.error('Error fetching order details:', error);
				toast.error('Failed to fetch order details');
			} finally {
				setIsLoading(false);
			}
		}
	};

	const formatDate = (dateString: string): string => {
		const date = new Date(dateString);
		const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		const dayOfWeek = dayNames[date.getDay()];
		return `${dayOfWeek}, ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
	};

	const handleOrderAgain = (meal: Meal) => {
		setSelectedMeal(meal);
		setSelectedDate(undefined);
		setOrderAgainStep(1);
		setIsOrderAgainDialogOpen(true);
	};

	const handleAddToCart = () => {
		if (selectedMeal && selectedDate) {
			const newMeal: Meal = {
				...selectedMeal,
				id: uuidv4(),
				orderDate: selectedDate.toISOString(),
			};
			dispatch({ type: 'ADD_TO_CART', payload: newMeal });
			toast.success('Added to cart!');
			setIsOrderAgainDialogOpen(false);
			setSelectedMeal(null);
			setSelectedDate(undefined);
			setOrderAgainStep(1);
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
		const isBlocked = state.blockedDates.some(
			(blockedDate) => new Date(blockedDate).toDateString() === date.toDateString()
		);

		return !(isWeekend || isPast || isBlocked);
	};

	const renderOrderAgainDialogContent = () => {
		switch (orderAgainStep) {
			case 1:
				return (
					<>
						<DialogHeader>
							<DialogTitle>Select a Date</DialogTitle>
						</DialogHeader>
						<div className="w-full flex justify-center mt-4">
							<Calendar
								mode="single"
								selected={selectedDate}
								onSelect={setSelectedDate}
								disabled={(date) => !isValidDate(date)}
								className="rounded-md border"
							/>
						</div>
						<div className="flex justify-end mt-4">
							<Button onClick={() => setOrderAgainStep(2)} disabled={!selectedDate}>
								Next
							</Button>
						</div>
					</>
				);
			case 2:
				return (
					<>
						<DialogHeader>
							<DialogTitle>Confirm Your Order</DialogTitle>
						</DialogHeader>
						<div className="mt-4 space-y-4">
							<div className="bg-gray-100 p-3 rounded-md">
								<h3 className="text-sm font-semibold mb-2">Order Details:</h3>
								<p><strong>Main:</strong> {selectedMeal?.main.display}</p>
								<p><strong>Add-ons:</strong> {selectedMeal?.addOns.map(addon => addon.display).join(', ') || 'None'}</p>
								<p><strong>For:</strong> {selectedMeal?.child.name}</p>
								<p><strong>At:</strong> {selectedMeal?.school.name}</p>
								<p><strong>On:</strong> {selectedDate && formatDate(selectedDate.toISOString())}</p>
								<p><strong>Total:</strong> ${selectedMeal?.total.toFixed(2)}</p>
							</div>
						</div>
						<div className="flex justify-between mt-4">
							<Button variant="outline" onClick={() => setOrderAgainStep(1)}>
								Back
							</Button>
							<Button onClick={handleAddToCart}>
								Add to Cart
							</Button>
						</div>
					</>
				);
			default:
				return null;
		}
	};

	const NoOrdersCallToAction = () => (
		<Card className="mt-8">
			<CardHeader>
				<CardTitle className="text-2xl font-bold text-center">No Orders Yet</CardTitle>
			</CardHeader>
			<CardContent className="text-center">
				<Utensils className="mx-auto h-12 w-12 text-brand-taupe mb-4" />
				<p className="text-lg mb-4">
					You haven't placed any orders yet.
				</p>
				<Button 
					onClick={() => navigate('/order')} 
					className="bg-brand-dark-green text-brand-cream hover:bg-brand-dark-green/90"
				>
					Place Your First Order
				</Button>
			</CardContent>
		</Card>
	);

	return (
		<div className="w-full space-y-4">
			<h2 className="text-2xl font-bold">Order History</h2>

			{state.user?.orderHistory.length === 0 ? (
				<NoOrdersCallToAction />
			) : (
				<div className="rounded-md border overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[50px]">Order Number</TableHead>
								<TableHead className="w-[150px]">Ordered On</TableHead>
								<TableHead className="w-[100px]">Meals</TableHead>
								<TableHead className="w-[100px]">Order Total</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{state.user?.orderHistory.map((orderSummary) => (
								<React.Fragment key={orderSummary.orderId}>
									<TableRow
										className="cursor-pointer"
										onClick={() => handleOrderClick(orderSummary)}
									>
										<TableCell className='flex justify-start items-center gap-2'>
											{expandedOrderId === orderSummary.orderId ? (
												isLoading ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<ChevronUp className="h-4 w-4" />
												)
											) : (
												<ChevronDown className="h-4 w-4" />
											)}
											{orderSummary.customOrderNumber}
										</TableCell>
										<TableCell>{formatDate(orderSummary.createdAt)}</TableCell>
										<TableCell>{orderSummary.items}</TableCell>
										<TableCell>${orderSummary.total.toFixed(2)}</TableCell>
									</TableRow>
									{expandedOrderId === orderSummary.orderId && expandedOrderDetails && (
										<TableRow>
											<TableCell colSpan={4}>
												<div className="p-4 bg-gray-50 space-y-4">
													{expandedOrderDetails.meals.map((meal, index) => (
														<div key={index} className="bg-white p-3 rounded-md shadow-sm">
															<p><strong>{meal.main.display}</strong> for {meal.child.name}</p>
															<p className="text-sm">Add-ons: {meal.addOns.map((addon) => addon.display).join(', ')}</p>
															<p className="text-sm">Date: {formatDate(meal.orderDate)}</p>
															<p className="text-sm font-medium">Price: ${meal.total.toFixed(2)}</p>
															<div className="mt-2 flex justify-end">
																<Button
																	onClick={(e) => {
																		e.stopPropagation();
																		handleOrderAgain(meal);
																	}}
																	variant="outline"
																	size="sm"
																>
																	Order Again
																</Button>
															</div>
														</div>
													))}
												</div>
											</TableCell>
										</TableRow>
									)}
								</React.Fragment>
							))}
						</TableBody>
					</Table>
				</div>
			)}


			<Dialog open={isOrderAgainDialogOpen} onOpenChange={setIsOrderAgainDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					{renderOrderAgainDialogContent()}
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default OrderHistory;