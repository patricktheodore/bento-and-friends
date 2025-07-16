import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getAllDailyAnalytics, getCumulativeAnalytics, calculateMetrics } from '../services/analytics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
    DollarSign, 
    ShoppingCart, 
    Utensils, 
    Users, 
    GraduationCap, 
    TrendingUp,
    Calendar,
    BarChart3,
    Loader2
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

type GroupingOption = 'daily' | 'weekly' | 'monthly' | 'quarterly';

const AdminOverview: React.FC = () => {
    const { state } = useAppContext();
    const [dailyAnalytics, setDailyAnalytics] = useState<any[]>([]);
    const [groupedAnalytics, setGroupedAnalytics] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
    const [groupingOption, setGroupingOption] = useState<GroupingOption>('daily');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Determine how many days to fetch based on grouping option
    const getDaysToFetch = (option: GroupingOption) => {
        switch (option) {
            case 'quarterly': return 365; // Full year for quarterly view
            case 'monthly': return 365;   // Full year for monthly view
            case 'weekly': return 180;    // ~6 months for weekly view
            case 'daily': return 90;      // ~3 months for daily view
            default: return 180;
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                const daysToFetch = getDaysToFetch(groupingOption);
                const [dailyData, cumulativeData] = await Promise.all([
                    getAllDailyAnalytics(daysToFetch),
                    getCumulativeAnalytics(),
                ]);

                setDailyAnalytics(dailyData.reverse());
                setMetrics(calculateMetrics(cumulativeData));
            } catch (error) {
                console.error('Error fetching analytics data:', error);
                setError('Failed to load analytics data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [groupingOption]); // Re-fetch when grouping changes

    useEffect(() => {
        if (dailyAnalytics.length > 0) {
            setGroupedAnalytics(groupData(dailyAnalytics, groupingOption));
        }
    }, [dailyAnalytics, groupingOption]);

    const getQuarter = (date: Date) => {
        const month = date.getMonth();
        const quarter = Math.floor(month / 3) + 1;
        const year = date.getFullYear();
        return `${year}-Q${quarter}`;
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
            } else if (option === 'monthly') {
                key = date.toISOString().slice(0, 7); // YYYY-MM
            } else if (option === 'quarterly') {
                key = getQuarter(date); // YYYY-Q1, YYYY-Q2, etc.
            } else {
                key = date.toISOString().slice(0, 7); // Default to monthly
            }

            if (!groupedData[key]) {
                groupedData[key] = { ...day, date: key };
            } else {
                groupedData[key].orderCount += day.orderCount;
                groupedData[key].mealCount += day.mealCount;
                groupedData[key].revenue += day.revenue;
            }
        });

        return Object.values(groupedData).sort((a, b) => a.date.localeCompare(b.date));
    };

    const formatXAxis = (value: string) => {
        if (groupingOption === 'quarterly') {
            return value; // Already formatted as "YYYY-Q1", "YYYY-Q2", etc.
        }
        
        const date = new Date(value);
        if (groupingOption === 'daily') {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else if (groupingOption === 'weekly') {
            return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
    };

    const formatTooltipLabel = (value: string) => {
        if (groupingOption === 'quarterly') {
            const [year, quarter] = value.split('-');
            const quarterNames = {
                'Q1': 'Q1 (Jan-Mar)',
                'Q2': 'Q2 (Apr-Jun)', 
                'Q3': 'Q3 (Jul-Sep)',
                'Q4': 'Q4 (Oct-Dec)'
            };
            return `${year} ${quarterNames[quarter as keyof typeof quarterNames] || quarter}`;
        }
        return formatXAxis(value);
    };

    const getGroupingLabel = (option: GroupingOption) => {
        switch (option) {
            case 'daily': return 'Daily';
            case 'weekly': return 'Weekly';
            case 'monthly': return 'Monthly';
            case 'quarterly': return 'Quarterly';
            default: return 'Daily';
        }
    };

    const getDateRangeDescription = (option: GroupingOption) => {
        switch (option) {
            case 'daily': return 'Last 90 days';
            case 'weekly': return 'Last 6 months';
            case 'monthly': return 'Last 12 months';
            case 'quarterly': return 'Last 12 months by quarter';
            default: return 'Since October 2024';
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="w-full space-y-6 p-4 sm:p-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-gray-600 mt-1">Analytics and business insights</p>
                </div>

                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-600" />
                    <p className="text-lg text-gray-600">Loading analytics data...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="w-full space-y-6 p-4 sm:p-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-gray-600 mt-1">Analytics and business insights</p>
                </div>

                <Card>
                    <CardContent className="text-center py-12">
                        <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <BarChart3 className="h-8 w-8 text-red-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Analytics</h3>
                        <p className="text-gray-500 mb-6">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Retry
                        </button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 p-4 sm:p-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-600 mt-1">Analytics and business insights</p>
            </div>

            {/* Key Metrics Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Key Metrics</h2>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        All Time
                    </Badge>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Revenue Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <div className="p-2 bg-green-100 rounded-lg">
                                <DollarSign className="h-4 w-4 text-green-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${metrics.totalRevenue.toFixed(2)}</div>
                            <p className="text-xs text-gray-500">Lifetime revenue</p>
                        </CardContent>
                    </Card>

                    {/* Orders Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <ShoppingCart className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.totalOrders.toLocaleString()}</div>
                            <p className="text-xs text-gray-500">Lifetime orders</p>
                        </CardContent>
                    </Card>

                    {/* Meals Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Meals Served</CardTitle>
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Utensils className="h-4 w-4 text-orange-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.totalMeals.toLocaleString()}</div>
                            <p className="text-xs text-gray-500">Lifetime meals served</p>
                        </CardContent>
                    </Card>

                    {/* Active Users Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Users className="h-4 w-4 text-purple-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
                            <p className="text-xs text-gray-500">Registered users</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Additional Metrics Section */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Performance Metrics</h2>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Average Meals per Order */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Meals per Order</CardTitle>
                            <div className="p-2 bg-teal-100 rounded-lg">
                                <TrendingUp className="h-4 w-4 text-teal-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.averageMealsPerOrder.toFixed(2)}</div>
                            <p className="text-xs text-gray-500">All time average</p>
                        </CardContent>
                    </Card>

                    {/* Average Order Value */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <DollarSign className="h-4 w-4 text-indigo-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${metrics.averageRevenuePerOrder.toFixed(2)}</div>
                            <p className="text-xs text-gray-500">All time average</p>
                        </CardContent>
                    </Card>

                    {/* Average Meal Cost */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average Meal Cost</CardTitle>
                            <div className="p-2 bg-pink-100 rounded-lg">
                                <Utensils className="h-4 w-4 text-pink-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${metrics.averageMealCost.toFixed(2)}</div>
                            <p className="text-xs text-gray-500">All time average</p>
                        </CardContent>
                    </Card>

                    {/* Active Schools */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Schools</CardTitle>
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <GraduationCap className="h-4 w-4 text-yellow-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{state.schools.length}</div>
                            <p className="text-xs text-gray-500">Schools served</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Chart Section */}
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Order Analytics
                            </CardTitle>
                            <CardDescription className="mt-1">
                                {getGroupingLabel(groupingOption)} order trends - {getDateRangeDescription(groupingOption)}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <Select
                                value={groupingOption}
                                onValueChange={(value) => setGroupingOption(value as GroupingOption)}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {groupedAnalytics.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={groupedAnalytics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatXAxis}
                                    axisLine={true}
                                    tickLine={true}
                                    scale="auto"
                                    padding={{ left: 10, right: 10 }}
                                    fontSize={12}
                                />
                                <YAxis
                                    width={60}
                                    tickFormatter={(value) => value.toLocaleString()}
                                    axisLine={true}
                                    tickLine={true}
                                    scale="auto"
                                    padding={{ top: 20, bottom: 20 }}
                                    fontSize={12}
                                />
                                <Tooltip
                                    labelFormatter={(value) => formatTooltipLabel(value)}
                                    formatter={(value: number) => [value.toLocaleString(), 'Orders']}
                                    contentStyle={{
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    }}
                                />
                                <Bar
                                    dataKey="orderCount"
                                    fill="#3b82f6"
                                    animationBegin={0}
                                    animationDuration={750}
                                    animationEasing="ease"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                            <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-500">No data available for the selected period</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminOverview;