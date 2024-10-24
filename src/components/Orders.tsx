import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, startAfter, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Loader2, CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import toast from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Search } from 'lucide-react';
import debounce from 'lodash/debounce';
import { where } from 'firebase/firestore';

interface Meal {
	id: string;
	main: { display: string };
	addOns: Array<{ display: string }>;
	child: { name: string };
	orderDate: string;
	total: number;
}

interface Order {
	id: string;
	customOrderNumber: string;
	userEmail: string;
	createdAt: Timestamp;
	total: number;
	finalTotal: number;
	status: string;
	meals: Meal[];
}

const PAGE_SIZE = 50;

const OrdersComponent: React.FC = () => {
	const { state } = useAppContext();
	const [orders, setOrders] = useState<Order[]>([]);
	const [lastVisible, setLastVisible] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
	const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const [selectedMeal, setSelectedMeal] = useState<{ orderId: string; mealId: string } | null>(null);
	const [searchTerm, setSearchTerm] = useState('');

const fetchOrders = async (lastDoc?: any) => {
    setLoading(true);
    try {
        let ordersQuery;
        
        if (searchTerm) {
            // Query for matching order numbers
            ordersQuery = query(
                collection(db, 'orders'),
                where('customOrderNumber', '==', searchTerm.toUpperCase()),
                limit(PAGE_SIZE)
            );
        } else {
            // Default query
            ordersQuery = query(
                collection(db, 'orders'),
                orderBy('createdAt', 'desc'),
                limit(PAGE_SIZE)
            );
        }

        if (lastDoc) {
            ordersQuery = query(ordersQuery, startAfter(lastDoc));
        }

        const querySnapshot = await getDocs(ordersQuery);
        const newOrders = querySnapshot.docs.map(
            (doc) => ({
                id: doc.id,
                ...doc.data(),
            } as Order)
        );

        setOrders(lastDoc ? [...orders, ...newOrders] : newOrders);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHasMore(querySnapshot.docs.length === PAGE_SIZE);
    } catch (error) {
        console.error('Error fetching orders: ', error);
        toast.error('Failed to fetch orders');
    } finally {
        setLoading(false);
    }
};

// Add the debounced search handler
const debouncedSearch = debounce((term: string) => {
    setSearchTerm(term);
    setLastVisible(null); // Reset pagination when searching
}, 300);

const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setOrders([]); // Clear current results
    debouncedSearch(value);
};

// Update useEffect to include searchTerm dependency
useEffect(() => {
    fetchOrders();
}, [searchTerm]);

	const loadMore = () => {
		if (!loading && hasMore) {
			fetchOrders(lastVisible);
		}
	};

	const handleOrderClick = (orderId: string) => {
		setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
	};

	const formatDate = (timestamp: Timestamp): string => {
		const date = timestamp.toDate();
		const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		const dayOfWeek = dayNames[date.getDay()];
		return `${dayOfWeek}, ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
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

	const handleDateChange = (orderId: string, mealId: string) => {
		setSelectedMeal({ orderId, mealId });
		setIsDateDialogOpen(true);
	};

	const updateMealDate = async () => {
		if (!selectedMeal || !selectedDate) return;

		const { orderId, mealId } = selectedMeal;

		try {
			setLoading(true);
			const functions = getFunctions();
			const updateMealDeliveryDate = httpsCallable(functions, 'updateMealDeliveryDate');

			const result = await updateMealDeliveryDate({
				orderId,
				mealId,
				newDeliveryDate: selectedDate.toISOString(),
			});

			const data = result.data as { success: boolean };
			if (data.success) {
				// Update local state
				const updatedOrders = orders.map((order) => {
					if (order.id === orderId) {
						const updatedMeals = order.meals.map((meal) => {
							if (meal.id === mealId) {
								return { ...meal, orderDate: selectedDate.toISOString() };
							}
							return meal;
						});
						return { ...order, meals: updatedMeals };
					}
					return order;
				});

				setOrders(updatedOrders);
				toast.success('Meal delivery date updated successfully');
			} else {
				throw new Error('Failed to update meal delivery date');
			}
		} catch (error) {
			console.error('Error updating meal date:', error);
			toast.error('Failed to update meal delivery date');
		} finally {
			setLoading(false);
			setIsDateDialogOpen(false);
			setSelectedMeal(null);
			setSelectedDate(undefined);
		}
	};

	const getMealStatus = (orderDate: string) => {
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		const mealDate = new Date(orderDate);

		if (mealDate < yesterday) {
			return 'delivered';
		} else if (mealDate.getDate() === today.getDate()) {
			return 'today';
		} else {
			return 'upcoming';
		}
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'delivered':
				return <Badge variant="success">Delivered</Badge>;
			case 'today':
				return <Badge variant="alert">Today</Badge>;
			case 'upcoming':
				return <Badge variant="secondary">Upcoming</Badge>;
			default:
				return null;
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Orders</h2>
				<div className="relative max-w-sm w-full">
					<Input
						type="text"
						placeholder="Search by order number..."
						onChange={handleSearch}
						className="pl-10"
					/>
					<Search className="absolute left-3 top-2.5 h-5 w-5 text-brand-taupe" />
				</div>
			</div>
			<div className="rounded-md border overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[50px] px-2 py-3 text-xs sm:text-sm">Order #</TableHead>
							<TableHead className="hidden sm:table-cell">User Email</TableHead>
							<TableHead className="px-2 py-3 text-xs sm:text-sm">Date</TableHead>
							<TableHead className="px-2 py-3 text-xs sm:text-sm">Meals</TableHead>
							<TableHead className="px-2 py-3 text-xs sm:text-sm">Total</TableHead>
							<TableHead className="px-2 py-3 text-xs sm:text-sm">After Discount</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{orders.map((order) => (
							<React.Fragment key={order.id}>
								<TableRow
									className="cursor-pointer"
									onClick={() => handleOrderClick(order.id)}
								>
									<TableCell className="flex justify-start items-center gap-1 px-2 py-3 text-xs sm:text-sm">
										{expandedOrderId === order.id ? (
											<ChevronUp className="h-4 w-4 flex-shrink-0" />
										) : (
											<ChevronDown className="h-4 w-4 flex-shrink-0" />
										)}
										<span className="truncate">{order.customOrderNumber}</span>
									</TableCell>
									<TableCell className="hidden sm:table-cell">{order.userEmail}</TableCell>
									<TableCell className="px-2 py-3 text-xs sm:text-sm">
										{formatDate(order.createdAt)}
									</TableCell>
									<TableCell className="px-2 py-3 text-xs sm:text-sm">{order.meals.length}</TableCell>
									<TableCell className="px-2 py-3 text-xs sm:text-sm">
										${order.total.toFixed(2)}
									</TableCell>
									<TableCell className="px-2 py-3 text-xs sm:text-sm">	
										${order.finalTotal.toFixed(2)}
									</TableCell>
								</TableRow>
								{expandedOrderId === order.id && (
									<TableRow>
										<TableCell
											colSpan={6}
											className="p-0"
										>
											<div className="p-2 sm:p-4 bg-gray-50 space-y-2 sm:space-y-4">
												<div className='w-full flex flex-wrap gap-2'>
													{order.meals.map((meal) => {
														const mealStatus = getMealStatus(meal.orderDate);
														return (
															<div
																key={meal.id}
																className="bg-white p-2 sm:p-3 rounded-md shadow-sm text-xs sm:text-sm relative"
															>
																<div className="absolute top-2 sm:top-3 right-2 sm:right-3">
																	{getStatusBadge(mealStatus)}
																</div>
																<p className='pr-[120px]'>
																	<strong>{meal.main.display}</strong> for{' '}
																	{meal.child.name}
																</p>
																<p>
																	Add-ons:{' '}
																	{meal.addOns.map((addon) => addon.display).join(', ')}
																</p>
																<div className="flex justify-between items-center mt-2">
																	<p>
																		Date:{' '}
																		{formatDate(
																			Timestamp.fromDate(new Date(meal.orderDate))
																		)}
																	</p>
																	{mealStatus !== 'delivered' && (
																		<Button
																			variant="outline"
																			size="sm"
																			onClick={(e) => {
																				e.stopPropagation();
																				handleDateChange(order.id, meal.id);
																			}}
																		>
																			<CalendarIcon className="h-4 w-4 mr-2" />
																			Change Date
																		</Button>
																	)}
																</div>
																<p className="font-medium mt-2">
																	Price: ${meal.total.toFixed(2)}
																</p>
															</div>
														);
													})}

												</div>
											</div>
										</TableCell>
									</TableRow>
								)}
							</React.Fragment>
						))}
					</TableBody>
				</Table>
			</div>
			{hasMore && (
				<div className="flex justify-center mt-4">
					<Button
						onClick={loadMore}
						disabled={loading}
						className="text-sm"
					>
						{loading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Loading...
							</>
						) : (
							'Load More'
						)}
					</Button>
				</div>
			)}

			<Dialog
				open={isDateDialogOpen}
				onOpenChange={setIsDateDialogOpen}
			>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Change Delivery Date</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<Calendar
							mode="single"
							selected={selectedDate}
							onSelect={setSelectedDate}
							disabled={(date) => !isValidDate(date)}
							className="rounded-md border"
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsDateDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={updateMealDate}
							disabled={!selectedDate || loading}
						>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Updating...
								</>
							) : (
								'Update Date'
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default OrdersComponent;
