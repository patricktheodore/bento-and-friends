import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Meal, MealRecord } from '../models/order.model';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp, Loader2, Utensils, Edit, Calendar } from 'lucide-react';
import { Badge } from './ui/badge';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { getFunctions, httpsCallable } from 'firebase/functions';
import OrderDialog from './OrderDialog';
import { Main } from '@/models/item.model';

const OrderHistory: React.FC = () => {
	const { state, refreshUserData, loadOrderDetails, updateMealInOrder } = useAppContext();
    const navigate = useNavigate();
    
    // Track expanded orders
    const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());

    // Meal editing state
    const [showEditMealDialog, setShowEditMealDialog] = useState(false);
    const [mealToEdit, setMealToEdit] = useState<Meal | null>(null);
    const [editingMealId, setEditingMealId] = useState<string | null>(null);
    const [savingMealId, setSavingMealId] = useState<string | null>(null);

	const handleOrderClick = async (orderId: string) => {
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
			
			try {
				await loadOrderDetails(orderId);
			} catch (error) {
				console.error('Error loading order details:', error);
				toast.error('Failed to fetch order details');
				
				// Remove from expanded if fetch failed
				setExpandedOrderIds(prev => {
					const newSet = new Set(prev);
					newSet.delete(orderId);
					return newSet;
				});
			}
		}
	};

    // Get meal status for determining if editing is allowed
    const getMealStatus = (deliveryDate: string) => {
        const today = new Date();
        const mealDate = new Date(deliveryDate);

        if (mealDate < today) {
            return 'delivered';
        } else if (mealDate.toDateString() === today.toDateString()) {
            return 'today';
        } else {
            return 'upcoming';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'delivered':
                return <Badge variant="secondary" className="bg-green-100 text-green-800">Delivered</Badge>;
            case 'today':
                return <Badge variant="default" className="bg-orange-100 text-orange-800">Today</Badge>;
            case 'upcoming':
                return <Badge variant="outline" className="bg-blue-100 text-blue-800">Upcoming</Badge>;
            default:
                return null;
        }
    };

    // Check if meal can be edited (only upcoming meals, not today or delivered)
    const canEditMeal = (deliveryDate: string): boolean => {
        const status = getMealStatus(deliveryDate);
        return status === 'upcoming';
    };

    const editMeal = async (meal: MealRecord) => {
        setEditingMealId(meal.mealId);
        try {
            // Find the selected items from state
            const selectedMain: Main = state.mains.find(main => main.id === meal.mainId)!;
            const selectedAddons = state.addOns.filter(addon => meal.addOns.some(a => a.id === addon.id));
            const selectedFruit = state.fruits.find(fruit => fruit.id === meal.fruitId) || undefined;
            const selectedSide = state.sides.find(side => side.id === meal.sideId) || undefined;
            const selectedChild = state.user?.children.find(child => child.id === meal.childId)!;
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
            setShowEditMealDialog(true);
        } catch (error) {
            console.error('Error preparing meal for edit:', error);
            toast.error('Failed to load meal details');
        } finally {
            setEditingMealId(null);
        }
    };

    const handleCloseEditDialog = () => {
        setShowEditMealDialog(false);
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
                setShowEditMealDialog(false);
                setMealToEdit(null);
                
                // Find the order that contains this meal
                const orderId = [...state.orderDetails.keys()].find(id => {
                    const order = state.orderDetails.get(id);
                    return order?.meals.some(m => m.mealId === meal.id);
                });
                
                if (orderId) {
                    // Optimistically update the meal in the order details
                    updateMealInOrder(orderId, meal.id, updates);
                }
                
                // Refresh user data to sync with backend
                await refreshUserData();
                
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

    // Check if meal is being saved
    const isMealSaving = (mealId: string): boolean => {
        return savingMealId === mealId;
    };

	const RenderNoOrderHistory = () => (
		<Card className="mt-8">
			<CardHeader>
				<CardTitle className="text-2xl font-bold text-center">No Orders Yet</CardTitle>
			</CardHeader>
			<CardContent className="text-center">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Utensils className="h-8 w-8 text-gray-400" />
                </div>
				<h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
				<p className="text-gray-500 mb-6">
					You haven't placed any orders yet. Start by placing your first order!
				</p>
				<Button 
					onClick={() => navigate('/order')} 
					className="bg-blue-600 text-white hover:bg-blue-700"
				>
					Place Your First Order
				</Button>
			</CardContent>
		</Card>
	);

	// Helper functions using AppContext state
	const getOrderDetails = (orderId: string) => {
		return state.orderDetails.get(orderId) || null;
	};

	const isOrderLoading = (orderId: string): boolean => {
		return state.loadingOrderIds.has(orderId);
	};

	const isOrderExpanded = (orderId: string): boolean => {
		return expandedOrderIds.has(orderId);
	};

	return (
		<div className="w-full space-y-6 p-4 sm:p-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
                <p className="text-gray-600 mt-1">View and manage your previous orders</p>
            </div>

			{state.user?.orders.length === 0 ? (
				<RenderNoOrderHistory />
			) : (
                <Card>
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="font-semibold">Order ID</TableHead>
                                    <TableHead className="font-semibold">Ordered On</TableHead>
                                    <TableHead className="font-semibold text-center">Meals</TableHead>
                                    <TableHead className="font-semibold">Order Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {state.user?.orders.map((order) => (
                                    <React.Fragment key={order.orderId}>
                                        <TableRow
                                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={() => handleOrderClick(order.orderId)}
                                        >
                                            <TableCell className='flex justify-start items-center gap-3'>
                                                {isOrderExpanded(order.orderId) ? (
                                                    isOrderLoading(order.orderId) ? (
                                                        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                                    ) : (
                                                        <ChevronUp className="h-4 w-4 text-gray-500" />
                                                    )
                                                ) : (
                                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                                )}
                                                <span className="font-medium">#{order.orderId}</span>
                                            </TableCell>
                                            <TableCell className="text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    {new Date(order.orderedOn).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="rounded-full">
                                                    {order.itemCount}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium text-green-600">
                                                    ${order.totalPaid}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                        
                                        {isOrderExpanded(order.orderId) && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="p-0">
                                                    {isOrderLoading(order.orderId) ? (
                                                        <div className="p-8 bg-gray-50 flex justify-center items-center">
                                                            <Loader2 className="h-6 w-6 animate-spin mr-3 text-blue-600" />
                                                            <span className="text-gray-600">Loading order details...</span>
                                                        </div>
                                                    ) : (
                                                        (() => {
                                                            const orderDetails = getOrderDetails(order.orderId);
                                                            if (!orderDetails) {
                                                                return (
                                                                    <div className="p-8 bg-gray-50 text-center">
                                                                        <div className="text-red-500 font-medium">Failed to load order details</div>
                                                                        <Button 
                                                                            variant="outline" 
                                                                            size="sm" 
                                                                            className="mt-2"
                                                                            onClick={() => handleOrderClick(order.orderId)}
                                                                        >
                                                                            Try Again
                                                                        </Button>
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <div className="p-6 bg-gray-50 space-y-6">
                                                                    {/* Order Summary */}
                                                                    <div className="bg-white p-4 rounded-lg shadow-sm">
                                                                        <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                                                            Order Summary
                                                                        </h4>
                                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                                            <div>
                                                                                <span className="font-medium text-gray-500">Status</span>
                                                                                <p className="text-gray-900 capitalize">{orderDetails.status}</p>
                                                                            </div>
                                                                            <div>
                                                                                <span className="font-medium text-gray-500">Total Items</span>
                                                                                <p className="text-gray-900">{orderDetails.itemCount}</p>
                                                                            </div>
                                                                            <div>
                                                                                <span className="font-medium text-gray-500">Subtotal</span>
                                                                                <p className="text-gray-900">${orderDetails.pricing.subtotal}</p>
                                                                            </div>
                                                                            <div>
                                                                                <span className="font-medium text-gray-500">Final Total</span>
                                                                                <p className="text-gray-900 font-medium">${orderDetails.pricing.finalTotal}</p>
                                                                            </div>
                                                                            {orderDetails.pricing.appliedCoupon && (
                                                                                <div className="col-span-2 md:col-span-4 pt-2 border-t">
                                                                                    <span className="font-medium text-gray-500">Discount Applied: </span>
                                                                                    <span className="text-green-600 font-medium">
                                                                                        (-${orderDetails.pricing.appliedCoupon.discountAmount})
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Meals */}
                                                                    <div className="bg-white p-4 rounded-lg shadow-sm">
                                                                        <h5 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                                                            Meals ({orderDetails.meals.length})
                                                                        </h5>
                                                                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                                                            {orderDetails.meals.map((meal) => {
                                                                                const mealStatus = getMealStatus(meal.deliveryDate);
                                                                                const canEdit = canEditMeal(meal.deliveryDate);
                                                                                const isMealBeingEdited = editingMealId === meal.mealId;
                                                                                const isMealBeingSaved = isMealSaving(meal.mealId);
                                                                                const isMealDisabled = isMealBeingEdited || isMealBeingSaved;

                                                                                return (
                                                                                    <div key={meal.mealId} className="border rounded-lg p-4 bg-gray-50 relative">
                                                                                        {isMealBeingSaved && (
                                                                                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                                                                                                <div className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-sm border">
                                                                                                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                                                                                    <span className="text-sm font-medium text-gray-700">
                                                                                                        Saving...
                                                                                                    </span>
                                                                                                </div>
                                                                                            </div>
                                                                                        )}

                                                                                        <div className="flex justify-between items-start mb-3">
                                                                                            <h6 className="font-medium text-lg text-gray-900">{meal.mainName}</h6>
                                                                                            {getStatusBadge(mealStatus)}
                                                                                        </div>
                                                                                        
                                                                                        <div className="space-y-2 text-sm text-gray-600">
                                                                                            <div>
                                                                                                <span className="font-medium">For:</span> {meal.childName}
                                                                                            </div>
                                                                                            <div>
                                                                                                <span className="font-medium">School:</span> {meal.schoolName}
                                                                                            </div>
                                                                                            <div>
                                                                                                <span className="font-medium">Delivery Date:</span> {new Date(meal.deliveryDate).toLocaleDateString()}
                                                                                            </div>
                                                                                            
                                                                                            {meal.addOns.length > 0 && (
                                                                                                <div>
                                                                                                    <span className="font-medium">Add-ons:</span> {meal.addOns.map((addon) => addon.display).join(', ')}
                                                                                                </div>
                                                                                            )}
                                                                                            
                                                                                            {meal.fruitName && (
                                                                                                <div>
                                                                                                    <span className="font-medium">Fruit:</span> {meal.fruitName}
                                                                                                </div>
                                                                                            )}
                                                                                            
                                                                                            {meal.sideName && (
                                                                                                <div>
                                                                                                    <span className="font-medium">Side:</span> {meal.sideName}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                        
                                                                                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
                                                                                            <span className="font-medium text-green-600">
                                                                                                ${meal.totalAmount}
                                                                                            </span>
                                                                                            
                                                                                            {canEdit && (
                                                                                                <Button
                                                                                                    variant="outline"
                                                                                                    size="sm"
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        editMeal(meal);
                                                                                                    }}
                                                                                                    disabled={isMealDisabled}
                                                                                                    className="flex items-center gap-2"
                                                                                                >
                                                                                                    {isMealBeingEdited ? (
                                                                                                        <>
                                                                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                                                                            Loading...
                                                                                                        </>
                                                                                                    ) : (
                                                                                                        <>
                                                                                                            <Edit className="h-3 w-3" />
                                                                                                            Edit
                                                                                                        </>
                                                                                                    )}
                                                                                                </Button>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                        
                                                                        {orderDetails.meals.some(meal => canEditMeal(meal.deliveryDate)) && (
                                                                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                                                <p className="text-sm text-blue-800">
                                                                                    <strong>Note:</strong> You can edit the recipient, delivery dates, sides, and fruits for upcoming meals. 
                                                                                    Changes cannot be made for today's deliveries or past orders.
                                                                                </p>
                                                                            </div>
                                                                        )}
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
                </Card>
			)}

            {/* Edit Meal Dialog */}
            {showEditMealDialog && mealToEdit && (
                <OrderDialog
                    key={`edit-${mealToEdit.id}`}
                    isOpen={showEditMealDialog}
                    onClose={handleCloseEditDialog}
                    editingMeal={mealToEdit}
                    onSave={handleSaveMeal}
                    customerEdit={true}
                />
            )}
		</div>
	);
};

export default OrderHistory;