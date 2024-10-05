import React, { useState, useEffect } from 'react';
import { getMealsBetweenDates } from '../services/run-sheet-operations';
import { useAppContext } from '../context/AppContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Timestamp } from 'firebase/firestore';

const RunSheet: React.FC = () => {
	const { state } = useAppContext();
	const [meals, setMeals] = useState<any[]>([]);
	const [dateRange, setDateRange] = useState<DateRange>({
		from: new Date(),
		to: new Date(),
	});
	const [selectedSchool, setSelectedSchool] = useState<string | undefined>('all');
	const [isLoading, setIsLoading] = useState(false);
	const [quickSelect, setQuickSelect] = useState('today');

	useEffect(() => {
		handleQuickSelect('today');
	}, []);

	const handleQuickSelect = (option: string) => {
		const today = new Date();
		let newRange: DateRange;

		switch (option) {
			case 'today':
				newRange = { from: today, to: today };
				break;
			case 'tomorrow':
				const tomorrow = addDays(today, 1);
				newRange = { from: tomorrow, to: tomorrow };
				break;
			case 'this-week':
				newRange = { from: startOfWeek(today), to: endOfWeek(today) };
				break;
			case 'next-week':
				const nextWeekStart = startOfWeek(addWeeks(today, 1));
				newRange = { from: nextWeekStart, to: endOfWeek(nextWeekStart) };
				break;
			case 'this-month':
				newRange = { from: startOfMonth(today), to: endOfMonth(today) };
				break;
			case 'custom':
				return; // Don't update the date range for custom option
			default:
				newRange = { from: today, to: today };
		}

		setDateRange(newRange);
		setQuickSelect(option);
		handleSearch(newRange);
	};

	const handleSchoolSelect = (schoolId: string) => {
		setSelectedSchool(schoolId);
		handleSearch(dateRange, schoolId);
	};

	const handleSearch = async (range: DateRange = dateRange, school: string | undefined = selectedSchool) => {
		if (!range.from) return;

		setIsLoading(true);
		const startDate = range.from;
		const endDate = range.to || range.from;

		try {
			const fetchedMeals = await getMealsBetweenDates(startDate, endDate, school === 'all' ? undefined : school);
			setMeals(fetchedMeals);
		} catch (error) {
			console.error('Error fetching meals:', error);
			// You might want to show an error message to the user here
		} finally {
			setIsLoading(false);
		}
	};

	const formatDate = (date: Timestamp | string | Date): string => {
		let jsDate: Date;

		if (date instanceof Timestamp) {
			jsDate = date.toDate();
		} else if (typeof date === 'string') {
			jsDate = new Date(date);
		} else if (date instanceof Date) {
			jsDate = date;
		} else {
			return 'Invalid Date';
		}

		const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		const dayOfWeek = dayNames[jsDate.getDay()];
		return `${dayOfWeek}, ${jsDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
	};

	const formatAddOns = (addOns: any) => {
		if (!addOns || !Array.isArray(addOns)) return 'N/A';
		return addOns.map((addOn: any) => addOn.display).join(', ') || 'None';
	};

	return (
		<div className="w-full p-4 space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-3xl font-bold">Run Sheet</h2>
			</div>

			<div className="flex flex-col sm:flex-row gap-4 mb-4">
				<Select
					value={quickSelect}
					onValueChange={handleQuickSelect}
				>
					<SelectTrigger className="w-full bg-white sm:w-[200px]">
						<SelectValue placeholder="Select date range" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="today">Today</SelectItem>
						<SelectItem value="tomorrow">Tomorrow</SelectItem>
						<SelectItem value="this-week">This Week</SelectItem>
						<SelectItem value="next-week">Next Week</SelectItem>
						<SelectItem value="this-month">This Month</SelectItem>
						<SelectItem value="custom">Custom Date</SelectItem>
					</SelectContent>
				</Select>

				{quickSelect === 'custom' && (
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className="w-full sm:w-[300px] bg-white justify-start text-left font-normal"
							>
								<CalendarIcon className="mr-2 h-4 w-4" />
								{dateRange?.from ? (
									dateRange.to ? (
										<>
											{format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
										</>
									) : (
										format(dateRange.from, 'LLL dd, y')
									)
								) : (
									<span>Pick a date</span>
								)}
							</Button>
						</PopoverTrigger>
						<PopoverContent
							className="w-auto p-0"
							align="start"
						>
							<Calendar
								initialFocus
								mode="range"
								defaultMonth={dateRange?.from}
								selected={dateRange}
								onSelect={(newRange) => {
									if (newRange) {
										setDateRange(newRange);
										handleSearch(newRange);
									}
								}}
								numberOfMonths={2}
							/>
						</PopoverContent>
					</Popover>
				)}

				<Select
					value={selectedSchool}
					onValueChange={(school) => {
						handleSchoolSelect(school);
					}}
				>
					<SelectTrigger className="w-full bg-white sm:w-[200px]">
						<SelectValue placeholder="Select school" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Schools</SelectItem>
						{state.schools.map((school) => (
							<SelectItem
								key={school.id}
								value={school.id}
							>
								{school.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="rounded-md border bg-white">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Date</TableHead>
							<TableHead>Child</TableHead>
							<TableHead>School</TableHead>
							<TableHead>Main Dish</TableHead>
							<TableHead>Add-ons</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{meals.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="text-center"
								>
									No meals found
								</TableCell>
							</TableRow>
						) : (
							meals.map((meal) => (
								<TableRow key={meal.id}>
									<TableCell>{formatDate(meal.deliveryDate)}</TableCell>
									<TableCell>{meal.child.name || 'N/A'}</TableCell>
									<TableCell>{meal.school.name || 'N/A'}</TableCell>
									<TableCell>{meal.main.display || 'N/A'}</TableCell>
									<TableCell>{formatAddOns(meal.addOns)}</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
};

export default RunSheet;
