import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Meal } from '../models/order.model';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { fetchAllOrders } from '../services/user-service';
import { Button } from './ui/button';
import { PlusIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

interface GroupedMeals {
    [date: string]: Meal[];
}

const MealCalendar: React.FC = () => {
    const { state } = useAppContext();
    const [groupedMeals, setGroupedMeals] = useState<GroupedMeals>({});
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMeals = async () => {
            if (state.user) {
                setIsLoading(true);
                try {
                    const orders = await fetchAllOrders(state.user.id);
                    const now = moment().startOf('day');

                    const futureMeals = orders
                        .flatMap(order => order.meals)
                        .filter(meal => moment(meal.orderDate).isSameOrAfter(now));

                    const grouped = futureMeals.reduce((acc, meal) => {
                        const date = moment(meal.orderDate).format('dddd MMMM D, YYYY');
                        if (!acc[date]) {
                            acc[date] = [];
                        }
                        acc[date].push(meal);
                        return acc;
                    }, {} as GroupedMeals);

                    setGroupedMeals(grouped);
                } catch (error) {
                    console.error('Error fetching meals:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchMeals();
    }, [state.user]);

    if (isLoading) {
        return <p>Loading your meal calendar...</p>;
    }

    if (Object.keys(groupedMeals).length === 0) {
        return (
            <div className="text-center">
                <p className="mb-4">No upcoming meals scheduled.</p>
                <Button onClick={() => navigate('/order')}>
                    <PlusIcon className="mr-2 h-4 w-4" /> Order Now
                </Button>
            </div>
        );
    }

    const sortedDates = Object.keys(groupedMeals).sort((a, b) => 
        moment(a, 'dddd MMMM D, YYYY').diff(moment(b, 'dddd MMMM D, YYYY'))
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Upcoming Meals</h2>
                <Button onClick={() => navigate('/order')}>
                    <PlusIcon className="mr-2 h-4 w-4" /> Add New Order
                </Button>
            </div>
            {sortedDates.map((date) => (
                <div key={date} className="bg-brand-cream rounded-md p-2">
                    <h3 className="text-xl font-semibold m-2">{date}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-2">
                        {groupedMeals[date].map((meal, index) => (
                            <Card key={`${date}-${index}`}>
                                <CardHeader>
                                    <CardTitle>{meal.main.display}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p>For: {meal.child.name}</p>
                                    <p>School: {meal.school.name}</p>
                                    {meal.addOns.length > 0 && (
                                        <p>Add-ons: {meal.addOns.map(addon => addon.display).join(', ')}</p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MealCalendar;