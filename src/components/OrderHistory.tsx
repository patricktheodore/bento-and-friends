import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Order, Meal } from '../models/order.model';
import { OrderHistorySummary } from '../models/user.model';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { fetchOrderDetails } from '../services/user-service';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar } from './ui/calendar';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

const OrderHistory: React.FC = () => {
	const { state, dispatch } = useAppContext();
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
		const day = date.getDay();
		const isWeekend = day === 0 || day === 6;
		const isPast = date <= today;
		return isWeekend || isPast;
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
								disabled={isValidDate}
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
							{selectedMeal?.note && (
								<div className="bg-gray-100 p-3 rounded-md">
									<h3 className="text-sm font-semibold mb-2">Special Instructions:</h3>
									<p>{selectedMeal.note}</p>
								</div>
							)}
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

	return (
		<div className="w-full space-y-4">
			<h2 className="text-2xl font-bold">Order History</h2>

			<div className="rounded-md border overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[50px]"></TableHead>
							<TableHead className="w-[150px]">Date</TableHead>
							<TableHead className="w-[80px]">Total</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{state.user?.orderHistory.map((orderSummary) => (
							<React.Fragment key={orderSummary.orderId}>
								<TableRow
									className="cursor-pointer"
									onClick={() => handleOrderClick(orderSummary)}
								>
									<TableCell>
										{expandedOrderId === orderSummary.orderId ? (
											isLoading ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<ChevronUp className="h-4 w-4" />
											)
										) : (
											<ChevronDown className="h-4 w-4" />
										)}
									</TableCell>
									<TableCell>{formatDate(orderSummary.createdAt)}</TableCell>
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

			<Dialog open={isOrderAgainDialogOpen} onOpenChange={setIsOrderAgainDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					{renderOrderAgainDialogContent()}
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default OrderHistory;