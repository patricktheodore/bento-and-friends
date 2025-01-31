import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getAllDailyAnalytics, getCumulativeAnalytics, calculateMetrics } from '../services/analytics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
  
import { useAppContext } from '@/context/AppContext';
import { Button } from './ui/button';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';

type GroupingOption = 'daily' | 'weekly' | 'monthly';

const AdminOverview: React.FC = () => {
	const { state } = useAppContext();
	const [isResetting, setIsResetting] = useState(false);
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

	const handleResetTermDetails = async () => {
		setIsResetting(true);
		try {
			const functions = getFunctions();
			const resetTermDetails = httpsCallable(functions, 'resetTermDetailsReview');

			const result = await resetTermDetails();
			const { usersUpdated } = result.data as { success: boolean; usersUpdated: number };

			toast.success(`Successfully reset term details for ${usersUpdated} users`);
		} catch (error) {
			console.error('Error resetting term details:', error);
			toast.error('Failed to reset term details. Please try again.');
		} finally {
			setIsResetting(false);
		}
	};

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
						<Select
							value={groupingOption}
							onValueChange={(value) => setGroupingOption(value as GroupingOption)}
						>
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
					<ResponsiveContainer
						width="100%"
						height={300}
					>
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

			<Card>
				<CardHeader>
					<CardTitle>Reset Term Details Review</CardTitle>
					<CardDescription>
						Reset the term details review flag for all users. This will prompt them to review their details
						when they next log in.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						Use this at the start of each new term to ensure all users review and update their details.
					</p>
				</CardContent>
				<CardFooter>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								variant="default"
								disabled={isResetting}
							>
								{isResetting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Resetting...
									</>
								) : (
									'Reset Term Details'
								)}
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Are you sure?</AlertDialogTitle>
								<AlertDialogDescription>
									This will reset the term details review flag for all users. They will be prompted to
									review their details when they next log in.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction onClick={handleResetTermDetails}>Continue</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</CardFooter>
			</Card>
		</div>
	);
};

export default AdminOverview;
