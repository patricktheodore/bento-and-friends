import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { MealRecord } from '../models/order.model';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { PlusIcon, Calendar, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import toast from 'react-hot-toast';
import { fetchOrderDetails } from '@/services/order-service';

interface GroupedMeals {
    [date: string]: MealRecord[];
}

const MealCalendar: React.FC = () => {
    const { state } = useAppContext();
    const [groupedMeals, setGroupedMeals] = useState<GroupedMeals>({});
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

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
                            {mealsForDate.map((meal) => (
                                <Card key={meal.mealId} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg">{meal.mainName}</CardTitle>
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
                                        
                                        <div className="pt-2 border-t">
                                            <p className="text-sm font-semibold text-green-600">
                                                ${meal.totalAmount.toFixed(2)}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default MealCalendar;