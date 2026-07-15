import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { ArrowDown, ArrowUp, ArrowUpDown, Building2, CalendarIcon, Loader2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getMealsBetweenDates } from '@/services/run-sheet-operations';

type SortColumn = 'school' | 'meals';
type SortDirection = 'asc' | 'desc';

interface SchoolRow {
	school: string;
	meals: number;
}

const SchoolBreakdown: React.FC = () => {
	const [dateRange, setDateRange] = useState<DateRange>({
		from: new Date(),
		to: new Date(),
	});
	const [rows, setRows] = useState<SchoolRow[]>([]);
	const [totalMeals, setTotalMeals] = useState<number>(0);
	const [isLoading, setIsLoading] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);
	const [sortColumn, setSortColumn] = useState<SortColumn>('meals');
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

	const handleSearch = async () => {
		if (!dateRange.from) {
			toast.error('Please select a date range.');
			return;
		}

		const startDate = dateRange.from;
		const endDate = dateRange.to || dateRange.from;

		setIsLoading(true);
		try {
			const meals = await getMealsBetweenDates(startDate, endDate);

			const countsBySchool = meals.reduce((acc, meal) => {
				const school = meal.schoolName || 'Unknown School';
				acc[school] = (acc[school] || 0) + 1;
				return acc;
			}, {} as Record<string, number>);

			const breakdown: SchoolRow[] = Object.entries(countsBySchool).map(([school, meals]) => ({
				school,
				meals,
			}));

			setRows(breakdown);
			setTotalMeals(meals.length);
			setHasSearched(true);
		} catch (error) {
			console.error('Error fetching school breakdown:', error);
			toast.error('Failed to load school breakdown. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleSort = (column: SortColumn) => {
		if (column === sortColumn) {
			setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortColumn(column);
			setSortDirection(column === 'school' ? 'asc' : 'desc');
		}
	};

	const sortedRows = useMemo(() => {
		const sorted = [...rows].sort((a, b) => {
			if (sortColumn === 'school') {
				return a.school.localeCompare(b.school);
			}
			return a.meals - b.meals;
		});
		return sortDirection === 'asc' ? sorted : sorted.reverse();
	}, [rows, sortColumn, sortDirection]);

	const renderSortIcon = (column: SortColumn) => {
		if (column !== sortColumn) {
			return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
		}
		return sortDirection === 'asc' ? (
			<ArrowUp className="h-4 w-4 text-gray-700" />
		) : (
			<ArrowDown className="h-4 w-4 text-gray-700" />
		);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
					<Building2 className="h-5 w-5" />
					School Breakdown
				</h2>
				<p className="text-sm text-gray-600 mt-1">
					View the number of meals delivered per school across a date range.
				</p>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Date Range</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
						<div className="space-y-2">
							<label className="text-sm font-medium text-gray-700">Delivery Date Range</label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className="w-full bg-white justify-start text-left font-normal"
										disabled={isLoading}>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{dateRange?.from ? (
											dateRange.to ? (
												<>
													{format(dateRange.from, 'LLL dd, y')} -{' '}
													{format(dateRange.to, 'LLL dd, y')}
												</>
											) : (
												format(dateRange.from, 'LLL dd, y')
											)
										) : (
											<span>Pick a date</span>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										initialFocus
										mode="range"
										defaultMonth={dateRange?.from}
										selected={dateRange}
										onSelect={(range) => range && setDateRange(range)}
										numberOfMonths={2}
										disabled={isLoading}
									/>
								</PopoverContent>
							</Popover>
						</div>
						<Button onClick={handleSearch} disabled={isLoading}>
							{isLoading ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Search className="mr-2 h-4 w-4" />
							)}
							Generate
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Loading */}
			{isLoading && (
				<Card>
					<CardContent className="text-center py-12">
						<Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-600 mx-auto" />
						<p className="text-lg text-gray-600">Loading school breakdown...</p>
					</CardContent>
				</Card>
			)}

			{/* Empty state */}
			{!isLoading && hasSearched && rows.length === 0 && (
				<Card>
					<CardContent className="text-center py-12">
						<div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
							<Building2 className="h-6 w-6 text-gray-400" />
						</div>
						<h3 className="text-lg font-medium text-gray-900 mb-2">No Meals Found</h3>
						<p className="text-gray-500">No meals are scheduled for delivery in the selected date range.</p>
					</CardContent>
				</Card>
			)}

			{/* Results */}
			{!isLoading && rows.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold text-gray-900">Results</h3>
						<div className="flex items-center gap-2">
							<Badge variant="outline" className="bg-blue-50 text-blue-700">
								{rows.length} {rows.length === 1 ? 'school' : 'schools'}
							</Badge>
							<Badge variant="outline" className="bg-green-50 text-green-700">
								{totalMeals} meals
							</Badge>
						</div>
					</div>

					<Card>
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>
											<button
												type="button"
												onClick={() => handleSort('school')}
												className="flex items-center gap-1 font-medium hover:text-gray-900">
												School
												{renderSortIcon('school')}
											</button>
										</TableHead>
										<TableHead className="text-right">
											<button
												type="button"
												onClick={() => handleSort('meals')}
												className="flex items-center gap-1 font-medium hover:text-gray-900 ml-auto">
												Meals Delivered
												{renderSortIcon('meals')}
											</button>
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{sortedRows.map((row) => (
										<TableRow key={row.school}>
											<TableCell className="font-medium">{row.school}</TableCell>
											<TableCell className="text-right">{row.meals}</TableCell>
										</TableRow>
									))}
									<TableRow className="bg-gray-50 font-semibold">
										<TableCell>Total</TableCell>
										<TableCell className="text-right">{totalMeals}</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
};

export default SchoolBreakdown;
