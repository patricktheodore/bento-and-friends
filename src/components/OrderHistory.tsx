import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { OrderRecord } from '../models/order.model';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp, Loader2, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { fetchOrderDetails } from '@/services/order-service';

const OrderHistory: React.FC = () => {
	const { state } = useAppContext();
    const navigate = useNavigate();
    
    // Changed to Set to track multiple expanded orders
    const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());
    
    // Cache to store fetched order details
    const [orderDetailsCache, setOrderDetailsCache] = useState<Map<string, OrderRecord>>(new Map());
    
    // Track loading states for individual orders
    const [loadingOrders, setLoadingOrders] = useState<Set<string>>(new Set());

	const handleOrderClick = async (orderId: string) => {
		// Check if order is currently expanded
		const isExpanded = expandedOrderIds.has(orderId);
		
		if (isExpanded) {
			// Collapse the order
			setExpandedOrderIds(prev => {
				const newSet = new Set(prev);
				newSet.delete(orderId);
				return newSet;
			});
		} else {
			// Expand the order
			setExpandedOrderIds(prev => new Set(prev).add(orderId));
			
			// Check if we already have the data cached
			if (!orderDetailsCache.has(orderId)) {
				// Add to loading state
				setLoadingOrders(prev => new Set(prev).add(orderId));
				
				try {
					const orderDetails = await fetchOrderDetails(orderId);
					
					// Cache the order details
					setOrderDetailsCache(prev => new Map(prev).set(orderId, orderDetails));
				} catch (error) {
					console.error('Error fetching order details:', error);
					toast.error('Failed to fetch order details');
					
					// Remove from expanded if fetch failed
					setExpandedOrderIds(prev => {
						const newSet = new Set(prev);
						newSet.delete(orderId);
						return newSet;
					});
				} finally {
					// Remove from loading state
					setLoadingOrders(prev => {
						const newSet = new Set(prev);
						newSet.delete(orderId);
						return newSet;
					});
				}
			}
		}
	};

	const RenderNoOrderHistory = () => (
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

	// Helper function to get order details from cache
	const getOrderDetails = (orderId: string): OrderRecord | null => {
		return orderDetailsCache.get(orderId) || null;
	};

	// Helper function to check if order is loading
	const isOrderLoading = (orderId: string): boolean => {
		return loadingOrders.has(orderId);
	};

	// Helper function to check if order is expanded
	const isOrderExpanded = (orderId: string): boolean => {
		return expandedOrderIds.has(orderId);
	};

	return (
		<div className="w-full space-y-4">
			<h2 className="text-2xl font-bold">Order History</h2>

			{state.user?.orders.length === 0 ? (
				<RenderNoOrderHistory />
			) : (
				<div className="rounded-md border overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[50px]">Order Id</TableHead>
								<TableHead className="w-[150px]">Ordered On</TableHead>
								<TableHead className="w-[100px]">Meals</TableHead>
								<TableHead className="w-[100px]">Order Total</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{state.user?.orders.map((order) => (
								<React.Fragment key={order.orderId}>
									<TableRow
										className="cursor-pointer hover:bg-gray-50"
										onClick={() => handleOrderClick(order.orderId)}
									>
										<TableCell className='flex justify-start items-center gap-2'>
											{isOrderExpanded(order.orderId) ? (
												isOrderLoading(order.orderId) ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<ChevronUp className="h-4 w-4" />
												)
											) : (
												<ChevronDown className="h-4 w-4" />
											)}
											{order.orderId}
										</TableCell>
										<TableCell>{new Date(order.orderedOn).toLocaleDateString()}</TableCell>
										<TableCell>{order.itemCount}</TableCell>
										<TableCell>${order.totalPaid}</TableCell>
									</TableRow>
									
									{isOrderExpanded(order.orderId) && (
										<TableRow>
											<TableCell colSpan={4}>
												{isOrderLoading(order.orderId) ? (
													<div className="p-4 bg-gray-50 flex justify-center items-center">
														<Loader2 className="h-6 w-6 animate-spin mr-2" />
														<span>Loading order details...</span>
													</div>
												) : (
													(() => {
														const orderDetails = getOrderDetails(order.orderId);
														if (!orderDetails) {
															return (
																<div className="p-4 bg-gray-50 text-center text-red-500">
																	Failed to load order details
																</div>
															);
														}

														return (
															<div className="p-4 bg-gray-50 space-y-4">
																<div className="mb-4">
																	<h4 className="font-semibold text-lg mb-2">Order Details</h4>
																	<div className="grid grid-cols-2 gap-4 text-sm">
																		<div>
																			<span className="font-medium">Status:</span> {orderDetails.status}
																		</div>
																		<div>
																			<span className="font-medium">Total Items:</span> {orderDetails.itemCount}
																		</div>
																		<div>
																			<span className="font-medium">Subtotal:</span> ${orderDetails.pricing.subtotal}
																		</div>
																		<div>
																			<span className="font-medium">Final Total:</span> ${orderDetails.pricing.finalTotal}
																		</div>
																		{orderDetails.pricing.appliedCoupon && (
																			<div className="col-span-2">
																				<span className="font-medium">Coupon Applied:</span> {orderDetails.pricing.appliedCoupon.code} (-${orderDetails.pricing.appliedCoupon.discountAmount})
																			</div>
																		)}
																	</div>
																</div>

																<div>
																	<h5 className="font-semibold mb-3">Meals:</h5>
                                                                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                                                        {orderDetails.meals.map((meal) => (
                                                                            <div key={meal.mealId} className="bg-white p-3 rounded-md shadow-sm mb-3">
                                                                                <div className="flex justify-between items-start">
                                                                                    <div className="flex-1">
                                                                                        <p className="font-medium text-lg">{meal.mainName}</p>
                                                                                        <p className="text-sm text-gray-600 mb-1">
                                                                                            <span className="font-medium">For:</span> {meal.childName}
                                                                                        </p>
                                                                                        <p className="text-sm text-gray-600 mb-1">
                                                                                            <span className="font-medium">School:</span> {meal.schoolName}
                                                                                        </p>
                                                                                        <p className="text-sm text-gray-600 mb-1">
                                                                                            <span className="font-medium">Delivery Date:</span> {new Date(meal.deliveryDate).toLocaleDateString()}
                                                                                        </p>
                                                                                        
                                                                                        {meal.addOns.length > 0 && (
                                                                                            <p className="text-sm text-gray-600 mb-1">
                                                                                                <span className="font-medium">Add-ons:</span> {meal.addOns.map((addon) => addon.display).join(', ')}
                                                                                            </p>
                                                                                        )}
                                                                                        
                                                                                        {meal.fruitName && (
                                                                                            <p className="text-sm text-gray-600 mb-1">
                                                                                                <span className="font-medium">Fruit:</span> {meal.fruitName}
                                                                                            </p>
                                                                                        )}
                                                                                        
                                                                                        {meal.sideName && (
                                                                                            <p className="text-sm text-gray-600 mb-1">
                                                                                                <span className="font-medium">Side:</span> {meal.sideName}
                                                                                            </p>
                                                                                        )}
                                                                                        
                                                                                        <p className="text-sm font-medium text-green-600 mt-2">
                                                                                            Price: ${meal.totalAmount}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
																</div>
															</div>
														);
													})()
												)}
											</TableCell>
										</TableRow>
									)}
								</React.Fragment>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
};

export default OrderHistory;