import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getAllDailyAnalytics, getCumulativeAnalytics, calculateMetrics } from '../services/analytics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppContext } from '@/context/AppContext';

type GroupingOption = 'daily' | 'weekly' | 'monthly';

const AdminOverview: React.FC = () => {
	const { state } = useAppContext();
	const [dailyAnalytics, setDailyAnalytics] = useState<any[]>([]);
	const [groupedAnalytics, setGroupedAnalytics] = useState<any[]>([]);
	const [metrics, setMetrics] = useState<any>(null);
	const [groupingOption, setGroupingOption] = useState<GroupingOption>('daily');

	useEffect(() => {
		const fetchData = async () => {
		  try {
			const [dailyData, cumulativeData] = await Promise.all([
			  getAllDailyAnalytics(180),
			  getCumulativeAnalytics(),
			]);
	
			setDailyAnalytics(dailyData.reverse());
			setMetrics(calculateMetrics(cumulativeData));
		  } catch (error) {
			console.error('Error fetching analytics data:', error);
		  }
		};
	
		fetchData();
	  }, []);
	
	  useEffect(() => {
		if (dailyAnalytics.length > 0) {
		  setGroupedAnalytics(groupData(dailyAnalytics, groupingOption));
		}
	  }, [dailyAnalytics, groupingOption]);
	
	  const groupData = (data: any[], option: GroupingOption) => {
		if (option === 'daily') return data;
	
		const groupedData: { [key: string]: any } = {};
	
		data.forEach((day) => {
		  const date = new Date(day.date);
		  let key: string;
	
		  if (option === 'weekly') {
			const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
			key = weekStart.toISOString().split('T')[0];
		  } else {
			key = date.toISOString().slice(0, 7); // YYYY-MM
		  }
	
		  if (!groupedData[key]) {
			groupedData[key] = { ...day, date: key };
		  } else {
			groupedData[key].orderCount += day.orderCount;
			groupedData[key].mealCount += day.mealCount;
			groupedData[key].revenue += day.revenue;
		  }
		});
	
		return Object.values(groupedData);
	  };
	
	  const formatXAxis = (value: string) => {
		const date = new Date(value);
		if (groupingOption === 'daily') {
		  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		} else if (groupingOption === 'weekly') {
		  return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
		} else {
		  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
		}
	  };
	
	  if (!metrics) {
		return <div>Loading...</div>;
	  }

	return (
		<div className="space-y-4">
			<h2 className="text-3xl font-bold">Dashboard Overview</h2>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">${metrics.totalRevenue.toFixed(2)}</div>
						<p className="text-xs text-muted-foreground">Lifetime revenue</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Orders</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{metrics.totalOrders}</div>
						<p className="text-xs text-muted-foreground">Lifetime orders</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Meals Served</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{metrics.totalMeals}</div>
						<p className="text-xs text-muted-foreground">Lifetime meals served</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Average Meals per Order</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{metrics.averageMealsPerOrder.toFixed(2)}</div>
						<p className="text-xs text-muted-foreground">All time</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">${metrics.averageRevenuePerOrder.toFixed(2)}</div>
						<p className="text-xs text-muted-foreground">All time</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Average Meal Cost</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">${metrics.averageMealCost.toFixed(2)}</div>
						<p className="text-xs text-muted-foreground">All time</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Schools</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{state.schools.length}</div>
						<p className="text-xs text-muted-foreground">Total schools served</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Users</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{metrics.totalUsers}</div>
						<p className="text-xs text-muted-foreground">Total registered users</p>
					</CardContent>
				</Card>
			</div>

			<Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Order Overview</CardTitle>
              <CardDescription>Showing total orders since October 2024</CardDescription>
            </div>
            <Select value={groupingOption} onValueChange={(value) => setGroupingOption(value as GroupingOption)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select grouping" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={groupedAnalytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                axisLine={true}
                tickLine={true}
                scale="auto"
                padding={{ left: 10, right: 10 }}
              />
              <YAxis
                width={50}
                tickFormatter={(value) => value.toLocaleString()}
                axisLine={true}
                tickLine={true}
                scale="auto"
                padding={{ top: 20, bottom: 20 }}
              />
              <Tooltip
                labelFormatter={(value) => formatXAxis(value)}
                formatter={(value: number) => [value.toLocaleString(), 'Orders']}
              />
              <Bar
                dataKey="orderCount"
                fill="#052D2A"
                animationBegin={0}
                animationDuration={750}
                animationEasing="ease"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
		</div>
	);
};

export default AdminOverview;
