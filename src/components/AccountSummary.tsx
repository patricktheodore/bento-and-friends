import React, { useMemo, useState, useEffect } from 'react';
import { User } from '../models/user.model';
import { OrderRecord } from '../models/order.model';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { fetchOrderDetails } from '@/services/order-service';

interface AccountSummaryProps {
  user: User;
}

const AccountSummary: React.FC<AccountSummaryProps> = ({ user }) => {
  const [orderDetails, setOrderDetails] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllOrderDetails = async () => {
      if (!user.orders || user.orders.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const orderDetailsPromises = user.orders.map(orderSummary => 
          fetchOrderDetails(orderSummary.orderId)
        );
        
        const details = await Promise.all(orderDetailsPromises);
        setOrderDetails(details);
      } catch (err) {
        console.error('Error fetching order details for summary:', err);
        setError('Failed to load order statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllOrderDetails();
  }, [user.orders]);

  const stats = useMemo(() => {
    if (!orderDetails.length) {
      return {
        totalOrders: 0,
        totalMeals: 0,
        totalMealValue: '0.00',
        totalPaid: '0.00',
        totalSavings: '0.00',
        averageMealValue: '0.00',
      };
    }

    const totalOrders = orderDetails.length;
    const totalMeals = orderDetails.reduce((sum, order) => sum + order.itemCount, 0);
    
    // Calculate total meal value (before discounts - using subtotal)
    const totalMealValue = orderDetails.reduce((sum, order) => sum + order.pricing.subtotal, 0);
    
    // Calculate total paid (after discounts - using finalTotal)
    const totalPaid = orderDetails.reduce((sum, order) => sum + order.pricing.finalTotal, 0);
    
    // Calculate savings (difference between subtotal and final total)
    const totalSavings = totalMealValue - totalPaid;
    
    // Calculate additional savings from applied coupons
    const couponSavings = orderDetails.reduce((sum, order) => {
      return sum + (order.pricing.appliedCoupon?.discountAmount || 0);
    }, 0);

    const totalSavingsWithCoupons = totalSavings + couponSavings;
    const averageMealValue = totalMeals > 0 ? totalPaid / totalMeals : 0;

    return {
      totalOrders,
      totalMeals,
      totalMealValue: totalMealValue.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      totalSavings: totalSavingsWithCoupons.toFixed(2),
      averageMealValue: averageMealValue.toFixed(2),
    };
  }, [orderDetails]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
        <Card>
          <CardContent className="flex items-center justify-center h-24">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading statistics...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
        <Card>
          <CardContent className="flex items-center justify-center h-24">
            <span className="text-red-500">{error}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user has no orders, show a simplified view
  if (!user.orders || user.orders.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              No orders yet
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Start ordering!
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">$0.00</div>
            <p className="text-xs text-muted-foreground">
              Bundle meals to save money
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 my-6">
      <h3 className="text-lg font-semibold">Account Statistics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Successfully completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMeals}</div>
            <p className="text-xs text-muted-foreground">
              Meals ordered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalPaid}</div>
            <p className="text-xs text-muted-foreground">
              After all discounts
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.totalSavings}</div>
            <p className="text-xs text-muted-foreground">
              From bundling & coupons
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional detailed stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cost Per Meal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.averageMealValue}</div>
            <p className="text-xs text-muted-foreground">
              Including all discounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalMealValue !== '0.00' 
                ? `${((parseFloat(stats.totalSavings) / parseFloat(stats.totalMealValue)) * 100).toFixed(1)}%`
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Money saved on orders
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountSummary;