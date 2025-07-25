import React, { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Loader2, Utensils, Edit, Filter, X, Mail, Hash } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import toast from 'react-hot-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import debounce from 'lodash/debounce';
import { fetchOrders, PaginatedOrdersResponse } from '@/services/admin-service';
import { Meal, MealRecord, OrderRecord } from '@/models/order.model';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import OrderDialog from './OrderDialog';
import { useAppContext } from '@/context/AppContext';
import { Main } from '@/models/item.model';
import { Child, User } from '@/models/user.model';
import { Link } from 'react-router-dom';

const PAGE_SIZE = 25;

interface SearchState {
	orderIdTerm: string;
	debouncedOrderIdTerm: string;
	emailTerm: string;
	debouncedEmailTerm: string;
	isSearching: boolean;
}

const OrdersComponent: React.FC = () => {
	const { state } = useAppContext();
	const [orders, setOrders] = useState<OrderRecord[]>([]);
	const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
	const [loading, setLoading] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [isSearchResult, setIsSearchResult] = useState(false);
	
	// Search state
	const [searchState, setSearchState] = useState<SearchState>({
		orderIdTerm: '',
		debouncedOrderIdTerm: '',
		emailTerm: '',
		debouncedEmailTerm: '',
		isSearching: false
	});
	
	const [mealToEdit, setMealToEdit] = useState<Meal | null>(null);
	const [adminState, setAdminState] = useState<Child[] | null>(null);
	const [showEditItemDialog, setShowEditItemDialog] = useState(false);
	const [editingMealId, setEditingMealId] = useState<string | null>(null);
	const [savingMealId, setSavingMealId] = useState<string | null>(null);
	const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());

	// Memoized check for saving state
	const isMealSaving = useCallback((mealId: string) => {
		const result = savingMealId === mealId;
		return result;
	}, [savingMealId]);

	const loadOrders = useCallback(async (isLoadMore: boolean = false) => {
		setLoading(true);
		try {
			const options = {
				pageSize: PAGE_SIZE,
				lastVisible: isLoadMore ? lastVisible : null,
				searchByOrderId: searchState.debouncedOrderIdTerm,
				searchByEmail: searchState.debouncedEmailTerm,
			};

			const response: PaginatedOrdersResponse = await fetchOrders(options);

			if (isLoadMore) {
				setOrders((prev) => [...prev, ...response.orders]);
			} else {
				setOrders(response.orders);
			}

			setLastVisible(response.lastVisible);
			setHasMore(response.hasMore);
			setIsSearchResult(!!(searchState.debouncedOrderIdTerm || searchState.debouncedEmailTerm));
		} catch (error) {
			console.error('Error fetching orders: ', error);
			toast.error('Failed to fetch orders');
		} finally {
			setLoading(false);
		}
	}, [lastVisible, searchState.debouncedOrderIdTerm, searchState.debouncedEmailTerm]);

	// Debounced search functions
	const debouncedOrderIdSearch = useCallback(
		debounce((searchTerm: string) => {
			setSearchState(prev => ({ 
				...prev, 
				debouncedOrderIdTerm: searchTerm,
				isSearching: false 
			}));
		}, 500),
		[]
	);

	const debouncedEmailSearch = useCallback(
		debounce((searchTerm: string) => {
			setSearchState(prev => ({ 
				...prev, 
				debouncedEmailTerm: searchTerm,
				isSearching: false 
			}));
		}, 500),
		[]
	);

	// Handle search input changes
	const handleOrderIdChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setSearchState(prev => ({ 
			...prev, 
			orderIdTerm: value,
			isSearching: value.trim() !== prev.debouncedOrderIdTerm.trim()
		}));
		debouncedOrderIdSearch(value);
	}, [debouncedOrderIdSearch]);

	const handleEmailChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setSearchState(prev => ({ 
			...prev, 
			emailTerm: value,
			isSearching: value.trim() !== prev.debouncedEmailTerm.trim()
		}));
		debouncedEmailSearch(value);
	}, [debouncedEmailSearch]);

	// Clear search and filters
	const clearFilters = useCallback(() => {
		setSearchState({ 
			orderIdTerm: '', 
			debouncedOrderIdTerm: '', 
			emailTerm: '', 
			debouncedEmailTerm: '', 
			isSearching: false 
		});
		setLastVisible(null);
		setOrders([]);
		setIsSearchResult(false);
	}, []);

	// Effect for search term changes
	useEffect(() => {
		// Skip the initial undefined state
		if (searchState.debouncedOrderIdTerm === undefined && searchState.debouncedEmailTerm === undefined) return;
		
		setLastVisible(null);
		setOrders([]);
		loadOrders(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchState.debouncedOrderIdTerm, searchState.debouncedEmailTerm]);

	// Initial load only
	useEffect(() => {
		loadOrders(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const loadMore = useCallback(() => {
		if (!loading && hasMore && !isSearchResult) {
			loadOrders(true);
		}
	}, [loading, hasMore, isSearchResult, loadOrders]);

	const getUserDetails = async (userId: string): Promise<User | null> => {
		try {
			const functions = getFunctions();
			const getUserById = httpsCallable(functions, 'getUserById');
			
			const result = await getUserById({ userId });
			const data = result.data as { success: boolean; user: User };
			
			return data.success ? data.user : null;
		} catch (error) {
			console.error('Error getting user details:', error);
			return null;
		}
	};

	// Updated to use Set-based expansion like OrderHistory
	const handleOrderClick = (orderId: string) => {
		const isExpanded = expandedOrderIds.has(orderId);

		if (isExpanded) {
			// Collapse the order
			setExpandedOrderIds((prev) => {
				const newSet = new Set(prev);
				newSet.delete(orderId);
				return newSet;
			});
		} else {
			// Expand the order
			setExpandedOrderIds((prev) => new Set(prev).add(orderId));
		}
	};

	const editMeal = async (meal: MealRecord) => {
		setEditingMealId(meal.mealId);
		try {
			// parse the meal to match the expected Meal type
			const user = await getUserDetails(meal.userId);
			setAdminState(user?.children || []);
			const selectedMain: Main = state.mains.find(main => main.id === meal.mainId)!;
			const selectedAddons = state.addOns.filter(addon => meal.addOns.some(a => a.id === addon.id));
			const selectedFruit = state.fruits.find(fruit => fruit.id === meal.fruitId) || undefined;
			const selectedSide = state.sides.find(side => side.id === meal.sideId) || undefined;
			const selectedChild = user?.children.find(child => child.id === meal.childId)!;
			const selectedSchool = state.schools.find(school => school.id === meal.schoolId)!;

			const parsedMeal: Meal = {
				id: meal.mealId,
				main: selectedMain,
				addOns: selectedAddons,
				fruit: selectedFruit,
				side: selectedSide,
				child: selectedChild,
				school: selectedSchool,
				total: meal.totalAmount,
				deliveryDate: new Date(meal.deliveryDate).toISOString(),
			};

			setMealToEdit(parsedMeal);
			setShowEditItemDialog(true);
		} catch (error) {
			console.error('Error preparing meal for edit:', error);
			toast.error('Failed to load meal details');
		} finally {
			setEditingMealId(null);
		}
	};

	const handleCloseModal = () => {
		setShowEditItemDialog(false);
		setMealToEdit(null);
	};

	const handleSaveMeal = async (meals: Meal | Meal[]) => {
		const meal = Array.isArray(meals) ? meals[0] : meals;

		if (!meal) {
			toast.error('No meal data provided');
			return;
		}

		setSavingMealId(meal.id);

		try {
			const functions = getFunctions();
			const updateMealRecord = httpsCallable(functions, 'updateMealRecord');

			const updates = {
				deliveryDate: meal.deliveryDate,
				mainId: meal.main.id,
				mainName: meal.main.display,
				addOns: meal.addOns.map((addon) => ({
					id: addon.id,
					display: addon.display,
				})),
				fruitId: meal.fruit?.id || null,
				fruitName: meal.fruit?.display || null,
				sideId: meal.side?.id || null,
				sideName: meal.side?.display || null,
				childId: meal.child.id,
				childName: meal.child.name,
				schoolId: meal.school.id,
				schoolName: meal.school.name,
				schoolAddress: meal.school.address,
				totalAmount: meal.total,
			};

			const result = await updateMealRecord({
				mealId: meal.id,
				updates,
			});

			const data = result.data as {
				success: boolean;
				message: string;
				mealId: string;
				updatedMeal?: any;
			};

			if (data.success) {
				toast.success('Meal updated successfully');
				setShowEditItemDialog(false);
				setMealToEdit(null);
				
				setTimeout(async () => {
					await loadOrders(false);
					setSavingMealId(null);
				}, 500);
			} else {
				toast.error('Failed to update meal');
			}
		} catch (error: any) {
			console.error('Error updating meal:', error);

			if (error?.code === 'permission-denied') {
				toast.error('You do not have permission to update meals');
			} else if (error?.code === 'not-found') {
				toast.error('Meal not found');
			} else if (error?.code === 'invalid-argument') {
				toast.error(`Invalid data: ${error.message}`);
			} else {
				toast.error('Failed to update meal. Please try again.');
			}
		} finally {
			setSavingMealId(null);
		}
	};

	const getMealStatus = (deliveryDate: string) => {
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		const mealDate = new Date(deliveryDate);

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

	const isOrderExpanded = (orderId: string): boolean => {
		return expandedOrderIds.has(orderId);
	};

    const uniqueSchoolNames = (meals: MealRecord[]) => {
        const schoolNames = meals.map(meal => meal.schoolName);
        return Array.from(new Set(schoolNames)).join(', ');
    };

	const RenderNoOrders = () => {
		const hasSearch = searchState.debouncedOrderIdTerm || searchState.debouncedEmailTerm;
		
		return (
			<Card className="mt-8">
				<CardHeader>
					<CardTitle className="text-2xl font-bold text-center">No Orders Found</CardTitle>
				</CardHeader>
				<CardContent className="text-center">
					<Utensils className="mx-auto h-12 w-12 text-brand-taupe mb-4" />
					<p className="text-lg mb-4">
						{hasSearch 
							? `No orders found matching your search criteria`
							: 'No orders available.'
						}
					</p>
					{hasSearch && (
						<Button variant="outline" onClick={clearFilters} className="inline-flex items-center gap-2">
							<X className="h-4 w-4" />
							Clear Search
						</Button>
					)}
				</CardContent>
			</Card>
		);
	};

	return (
		<div className="w-full space-y-4">
			
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Orders</h2>
                <div className='flex items-center gap-2'>
                    <Button variant={'outline'} size="sm">
                        <Link to="/manual-order">
                            Create Manual Order
                        </Link>
                    </Button>
                    
                    {/* Search Inputs */}
                    <div className="flex items-center gap-2">
                        <div className="relative max-w-48">
                            <Input
                                type="text"
                                placeholder="Search by full Order ID"
                                value={searchState.orderIdTerm}
                                onChange={handleOrderIdChange}
                                className="pl-10 pr-3"
                            />
                            <Hash className="absolute left-3 top-2.5 h-4 w-4 text-brand-taupe" />
                        </div>
                        
                        <div className="relative max-w-48">
                            <Input
                                type="text"
                                placeholder="Search by Email"
                                value={searchState.emailTerm}
                                onChange={handleEmailChange}
                                className="pl-10 pr-3"
                            />
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-brand-taupe" />
                        </div>
                        
                        {searchState.isSearching && (
                            <Loader2 className="h-5 w-5 text-brand-taupe animate-spin" />
                        )}
                    </div>
                </div>
			</div>

			{/* Active Filters & Search Status */}
			{(searchState.debouncedOrderIdTerm || searchState.debouncedEmailTerm) && (
				<div className="flex flex-wrap items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
					<div className="flex items-center gap-2">
						<Filter className="h-4 w-4 text-blue-600" />
						<span className="text-sm font-medium text-blue-900">Active Filters:</span>
					</div>
					
					{searchState.debouncedOrderIdTerm && (
						<Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
							Order ID: "{searchState.debouncedOrderIdTerm}"
						</Badge>
					)}
					
					{searchState.debouncedEmailTerm && (
						<Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
							Email: "{searchState.debouncedEmailTerm}"
						</Badge>
					)}
					
					<div className="flex items-center gap-2 ml-auto">
						<span className="text-sm text-blue-700">
							{orders.length} order{orders.length !== 1 ? 's' : ''} found
						</span>
						<Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2">
							<X className="h-3 w-3" />
						</Button>
					</div>
				</div>
			)}

			{orders.length === 0 && !loading ? (
				<RenderNoOrders />
			) : (
				<div className="rounded-md border overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[120px]">Order ID</TableHead>
								<TableHead className="hidden sm:table-cell">User</TableHead>
								<TableHead className="w-[150px]">Ordered On</TableHead>
								<TableHead className="w-[80px]">Meals</TableHead>
								<TableHead className="w-[100px]">Total</TableHead>
								<TableHead className="w-[120px]">Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{orders.map((order) => (
								<React.Fragment key={order.orderId}>
									<TableRow
										className="cursor-pointer hover:bg-gray-50"
										onClick={() => handleOrderClick(order.orderId)}>
										<TableCell className="flex justify-start items-center gap-2">
											{isOrderExpanded(order.orderId) ? (
												<ChevronUp className="h-4 w-4" />
											) : (
												<ChevronDown className="h-4 w-4" />
											)}
											<span className="truncate">{order.orderId}</span>
										</TableCell>
										<TableCell className="hidden sm:table-cell">{order.userEmail}</TableCell>
										<TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
										<TableCell>{order.meals.length}</TableCell>
										<TableCell>${order.totalAmount.toFixed(2)}</TableCell>
										<TableCell>
											<Badge variant={order.status === 'paid' ? 'success' : 'secondary'}>
												{order.status}
											</Badge>
										</TableCell>
									</TableRow>

									{isOrderExpanded(order.orderId) && (
										<TableRow>
											<TableCell colSpan={6}>
												<div className="p-4 bg-gray-50 space-y-4">
													<div className="mb-4">
														<h4 className="font-semibold text-lg mb-2">Order Details</h4>
														<div className="grid grid-cols-2 gap-4 text-sm">
															<div>
																<span className="font-medium">Order ID:</span>{' '}
																{order.orderId}
															</div>
                                                            <div>
                                                                <span className="font-medium">Delivered to:</span>{' '}
                                                                {uniqueSchoolNames(order.meals)}
                                                            </div>
															<div>
																<span className="font-medium">Total Meals:</span>{' '}
																{order.meals.length}
															</div>
															<div>
																<span className="font-medium">Order Date:</span>{' '}
																{new Date(order.createdAt).toLocaleDateString()}
															</div>
															<div>
																<span className="font-medium">Subtotal:</span> $
																{order.pricing?.subtotal || order.totalAmount}
															</div>
															<div>
																<span className="font-medium">Final Total:</span> $
																{order.pricing?.finalTotal || order.totalAmount}
															</div>
															{order.pricing?.appliedCoupon && (
																<div className="col-span-2">
																	<span className="font-medium">Coupon Applied:</span>{' '}
																	{order.pricing.appliedCoupon.code} (-$
																	{order.pricing.appliedCoupon.discountAmount})
																</div>
															)}
														</div>
													</div>

													<div>
														<h5 className="font-semibold mb-3">Meals:</h5>
														<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
															{order.meals.map((meal) => {
																const mealStatus = getMealStatus(meal.deliveryDate);
																const isMealBeingEdited = editingMealId === meal.mealId;
																const isMealBeingSaved = isMealSaving(meal.mealId);
																const isMealDisabled = isMealBeingEdited || isMealBeingSaved;
																
																return (
																	<div
																		key={`${meal.mealId}`}
																		className="bg-white p-4 rounded-md shadow-sm mb-3 relative">
																		{isMealBeingSaved && (
																			<div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-md">
																				<div className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-sm border">
																					<Loader2 className="h-4 w-4 animate-spin text-blue-600" />
																					<span className="text-sm font-medium text-gray-700">
																						Saving...
																					</span>
																				</div>
																			</div>
																		)}
																		
																		<div className="absolute top-2 right-2">
																			{getStatusBadge(mealStatus)}
																		</div>

																		<div className="flex-1 pr-20">
																			<p className="font-medium text-lg mb-2">
																				{meal.mainName}
																			</p>
																			<p className="text-sm text-gray-600 mb-1">
																				<span className="font-medium">
																					For:
																				</span>{' '}
																				{meal.childName}
																			</p>

																			{meal.schoolName && (
																				<p className="text-sm text-gray-600 mb-1">
																					<span className="font-medium">
																						School:
																					</span>{' '}
																					{meal.schoolName}
																				</p>
																			)}

																			<p className="text-sm text-gray-600 mb-1">
																				<span className="font-medium">
																					Delivery Date:
																				</span>{' '}
																				{new Date(
																					meal.deliveryDate
																				).toLocaleDateString()}
																			</p>

																			{meal.addOns.length > 0 && (
																				<p className="text-sm text-gray-600 mb-1">
																					<span className="font-medium">
																						Add-ons:
																					</span>{' '}
																					{meal.addOns
																						.map((addon) => addon.display)
																						.join(', ')}
																				</p>
																			)}

																			{meal.fruitName && (
																				<p className="text-sm text-gray-600 mb-1">
																					<span className="font-medium">
																						Fruit:
																					</span>{' '}
																					{meal.fruitName}
																				</p>
																			)}

																			{meal.sideName && (
																				<p className="text-sm text-gray-600 mb-1">
																					<span className="font-medium">
																						Side:
																					</span>{' '}
																					{meal.sideName}
																				</p>
																			)}

																			{mealStatus !== 'delivered' && (
																				<Button
																					variant="outline"
																					size="sm"
																					className="mt-2"
																					onClick={(e) => {
																						e.stopPropagation();
																						editMeal(meal);
																					}}
																					disabled={isMealDisabled}
																				>
																					{isMealBeingEdited ? (
																						<>
																							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
																							Loading...
																						</>
																					) : isMealBeingSaved ? (
																						<>
																							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
																							Saving...
																						</>
																					) : (
																						<>
																							<Edit className="h-4 w-4 mr-2" />
																							Edit Meal
																						</>
																					)}
																				</Button>
																			)}
																		</div>
																	</div>
																);
															})}
														</div>
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
			)}

			{hasMore && !isSearchResult && (
				<div className="flex justify-center mt-4">
					<Button
						onClick={loadMore}
						disabled={loading}
						className="text-sm">
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

			{showEditItemDialog && mealToEdit && (
				<OrderDialog
					key={`${mealToEdit?.id}`}
					isOpen={showEditItemDialog}
					onClose={handleCloseModal}
					editingMeal={mealToEdit}
					adminState={adminState}
					onSave={handleSaveMeal}
				/>
			)}
		</div>
	);
};

export default OrdersComponent;