import React, { useMemo } from 'react';
import { User } from '../models/user.model';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AccountSummaryProps {
  user: User;
}

const AccountSummary: React.FC<AccountSummaryProps> = ({ user }) => {
  const stats = useMemo(() => {
    const totalOrders = user.orderHistory?.length;
    const totalMeals = user.orderHistory?.reduce((sum, order) => sum + order.items, 0);
    
    // Calculate total meal value (before discounts)
    const totalMealValue = user.orderHistory?.reduce((sum, order) => {
      // Assuming each order has an 'originalTotal' field representing the sum of meal costs before discounts
      return sum + (order.originalTotal || order.total);
    }, 0);
    
    // Calculate total paid (after discounts)
    const totalPaid = user.orderHistory?.reduce((sum, order) => sum + order.total, 0);
    
    // Calculate savings
    const totalSavings = totalMealValue - totalPaid;

    const averageMealValue = totalMeals > 0 ? totalPaid / totalMeals : 0;

    return {
      totalOrders,
      totalMeals,
      totalMealValue: totalMealValue?.toFixed(2),
      totalPaid: totalPaid?.toFixed(2),
      totalSavings: totalSavings?.toFixed(2),
      averageMealValue: averageMealValue?.toFixed(2),
    };
  }, [user.orderHistory]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalOrders}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalMeals} meals ordered
          </p>
        </CardContent>
      </Card>
      {/* <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Meal Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalMealValue}</div>
          <p className="text-xs text-muted-foreground">
            Before discounts
          </p>
        </CardContent>
      </Card> */}
      {/* <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalPaid}</div>
          <p className="text-xs text-muted-foreground">
            After discounts
          </p>
        </CardContent>
      </Card> */}
      <Card className="bg-green-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">${stats.totalSavings}</div>
          <p className="text-xs text-muted-foreground">
            From bundling and discounts
          </p>
        </CardContent>
      </Card>
      {/* <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Meal Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.averageMealValue}</div>
        </CardContent>
      </Card> */}
    </div>
  );
};

export default AccountSummary;