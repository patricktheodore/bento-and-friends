import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getAllDailyAnalytics, getCumulativeAnalytics, calculateMetrics } from '../services/analytics';
import { useAppContext } from '@/context/AppContext';

const AdminOverview: React.FC = () => {
	const { state, dispatch } = useAppContext();
	const [dailyAnalytics, setDailyAnalytics] = useState<any[]>([]);
	const [metrics, setMetrics] = useState<any>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [dailyData, cumulativeData] = await Promise.all([
					getAllDailyAnalytics(90),
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
					<CardTitle>Order Overview</CardTitle>
					<CardDescription>Showing total daily orders (last 90 days)</CardDescription>
				</CardHeader>
				<CardContent>
					<ResponsiveContainer
						width="100%"
						height={300}
					>
						<BarChart data={dailyAnalytics}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis
								dataKey="date"
								tickFormatter={(value) => {
									const date = new Date(value);
									return date.toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric',
									});
								}}
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
								labelFormatter={(value) => {
									return new Date(value).toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric',
										year: 'numeric',
									});
								}}
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
