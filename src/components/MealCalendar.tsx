import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Meal, MealRecord } from '../models/order.model';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { PlusIcon, Calendar, Loader2, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/badge';
import moment from 'moment';
import toast from 'react-hot-toast';
import { fetchOrderDetails } from '@/services/order-service';
import { getFunctions, httpsCallable } from 'firebase/functions';
import OrderDialog from './OrderDialog';
import { Main } from '@/models/item.model';

interface GroupedMeals {
    [date: string]: MealRecord[];
}

const MealCalendar: React.FC = () => {
    const { state, refreshUserData, updateMealInOrder } = useAppContext();
    const [groupedMeals, setGroupedMeals] = useState<GroupedMeals>({});
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // Meal editing state
    const [showEditMealDialog, setShowEditMealDialog] = useState(false);
    const [mealToEdit, setMealToEdit] = useState<Meal | null>(null);
    const [editingMealId, setEditingMealId] = useState<string | null>(null);
    const [savingMealId, setSavingMealId] = useState<string | null>(null);

    useEffect(() => {
        const fetchFutureMeals = async () => {
            if (!state.user?.orders || state.user.orders.length === 0) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const now = moment().startOf('day');
                const allMeals: MealRecord[] = [];

                // Fetch details for all orders
                const orderDetailsPromises = state.user.orders.map(orderSummary => 
                    fetchOrderDetails(orderSummary.orderId)
                );

                const orderDetails = await Promise.all(orderDetailsPromises);

                // Extract all meals from all orders
                orderDetails.forEach(orderRecord => {
                    if (orderRecord.meals) {
                        allMeals.push(...orderRecord.meals);
                    }
                });

                // Filter for future meals only
                const futureMeals = allMeals.filter(meal => 
                    moment(meal.deliveryDate).isSameOrAfter(now)
                );

                // Group meals by delivery date
                const grouped = futureMeals.reduce((acc, meal) => {
                    const date = moment(meal.deliveryDate).format('dddd, MMMM D, YYYY');
                    if (!acc[date]) {
                        acc[date] = [];
                    }
                    acc[date].push(meal);
                    return acc;
                }, {} as GroupedMeals);

                setGroupedMeals(grouped);
            } catch (error) {
                console.error('Error fetching future meals:', error);
                toast.error('Failed to load meal calendar');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFutureMeals();
    }, [state.user?.orders]);

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
                
                // Refresh user data to sync with backend and reload the calendar
                await refreshUserData();
                
                // Reload the meal calendar data
                const now = moment().startOf('day');
                const allMeals: MealRecord[] = [];

                const orderDetailsPromises = state.user!.orders.map(orderSummary => 
                    fetchOrderDetails(orderSummary.orderId)
                );

                const orderDetailsResults = await Promise.all(orderDetailsPromises);

                orderDetailsResults.forEach(orderRecord => {
                    if (orderRecord.meals) {
                        allMeals.push(...orderRecord.meals);
                    }
                });

                const futureMeals = allMeals.filter(meal => 
                    moment(meal.deliveryDate).isSameOrAfter(now)
                );

                const grouped = futureMeals.reduce((acc, meal) => {
                    const date = moment(meal.deliveryDate).format('dddd, MMMM D, YYYY');
                    if (!acc[date]) {
                        acc[date] = [];
                    }
                    acc[date].push(meal);
                    return acc;
                }, {} as GroupedMeals);

                setGroupedMeals(grouped);
                
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

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p className="text-lg">Loading your meal calendar...</p>
            </div>
        );
    }

    if (!state.user?.orders || state.user.orders.length === 0) {
        return (
            <div className="text-center py-8">
                <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Orders Yet</h3>
                <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
                <Button onClick={() => navigate('/order')}>
                    <PlusIcon className="mr-2 h-4 w-4" /> Place Your First Order
                </Button>
            </div>
        );
    }

    if (Object.keys(groupedMeals).length === 0) {
        return (
            <div className="text-center py-8">
                <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Upcoming Meals</h3>
                <p className="text-gray-600 mb-4">All your scheduled meals have been delivered.</p>
                <Button onClick={() => navigate('/order')}>
                    <PlusIcon className="mr-2 h-4 w-4" /> Order More Meals
                </Button>
            </div>
        );
    }

    // Sort dates chronologically
    const sortedDates = Object.keys(groupedMeals).sort((a, b) => 
        moment(a, 'dddd, MMMM D, YYYY').diff(moment(b, 'dddd, MMMM D, YYYY'))
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Upcoming Meals</h2>
                    <p className="text-gray-600 mt-1">
                        {Object.values(groupedMeals).flat().length} meal{Object.values(groupedMeals).flat().length !== 1 ? 's' : ''} scheduled
                    </p>
                </div>
                <Button onClick={() => navigate('/order')}>
                    <PlusIcon className="mr-2 h-4 w-4" /> Start New Order
                </Button>
            </div>

            {sortedDates.map((date) => {
                const mealsForDate = groupedMeals[date];
                const isToday = moment().format('dddd, MMMM D, YYYY') === date;
                const isTomorrow = moment().add(1, 'day').format('dddd, MMMM D, YYYY') === date;
                
                return (
                    <div key={date} className="space-y-4">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-semibold">
                                {date}
                                {isToday && <span className="ml-2 text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Today</span>}
                                {isTomorrow && <span className="ml-2 text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Tomorrow</span>}
                            </h3>
                            <span className="text-sm text-gray-500">
                                {mealsForDate.length} meal{mealsForDate.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {mealsForDate.map((meal) => {
                                const mealStatus = getMealStatus(meal.deliveryDate);
                                const canEdit = canEditMeal(meal.deliveryDate);
                                const isMealBeingEdited = editingMealId === meal.mealId;
                                const isMealBeingSaved = isMealSaving(meal.mealId);
                                const isMealDisabled = isMealBeingEdited || isMealBeingSaved;

                                return (
                                    <Card key={meal.mealId} className="hover:shadow-md transition-shadow relative">
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

                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg">{meal.mainName}</CardTitle>
                                                {getStatusBadge(mealStatus)}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div className="space-y-1 text-sm">
                                                <p>
                                                    <span className="font-medium text-gray-700">For:</span> {meal.childName}
                                                </p>
                                                <p>
                                                    <span className="font-medium text-gray-700">School:</span> {meal.schoolName}
                                                </p>
                                                
                                                {meal.addOns.length > 0 && (
                                                    <p>
                                                        <span className="font-medium text-gray-700">Add-ons:</span>{' '}
                                                        {meal.addOns.map(addon => addon.display).join(', ')}
                                                    </p>
                                                )}
                                                
                                                {meal.fruitName && (
                                                    <p>
                                                        <span className="font-medium text-gray-700">Fruit:</span> {meal.fruitName}
                                                    </p>
                                                )}
                                                
                                                {meal.sideName && (
                                                    <p>
                                                        <span className="font-medium text-gray-700">Side:</span> {meal.sideName}
                                                    </p>
                                                )}
                                            </div>
                                            
                                            <div className="pt-2 border-t flex justify-between items-center">
                                                <p className="text-sm font-semibold text-green-600">
                                                    ${meal.totalAmount.toFixed(2)}
                                                </p>
                                                
                                                {canEdit && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            editMeal(meal);
                                                        }}
                                                        disabled={isMealDisabled}
                                                        className="flex items-center gap-1 h-8 px-3"
                                                    >
                                                        {isMealBeingEdited ? (
                                                            <>
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                                <span className="text-xs">Loading...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Edit className="h-3 w-3" />
                                                                <span className="text-xs">Edit</span>
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Note about editing */}
            {Object.values(groupedMeals).flat().some(meal => canEditMeal(meal.deliveryDate)) && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                        <strong>Note:</strong> You can edit the recipient, delivery dates, sides, and fruits for upcoming meals. 
                        Changes cannot be made for today's deliveries or past orders.
                    </p>
                </div>
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

export default MealCalendar;