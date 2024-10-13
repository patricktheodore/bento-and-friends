import React, { useState, useEffect } from 'react';
import { getMealsBetweenDates } from '../services/run-sheet-operations';
import { useAppContext } from '../context/AppContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks } from 'date-fns';
import { CalendarIcon, FileSpreadsheetIcon, Loader2, PrinterIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
		let newRange: DateRange | undefined;

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
				setQuickSelect(option);
				return;
			default:
				newRange = { from: today, to: today };
		}

		if (newRange) {
			setDateRange(newRange);
			setQuickSelect(option);
			handleSearch(newRange);
		}
	};

	const handleCustomDateChange = (newRange: DateRange | undefined) => {
		if (newRange?.from) {
			setDateRange(newRange);
			handleSearch(newRange);
		}
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

			// Show error toast
			toast.error('There was an error loading the run sheet for selected dates. Please refresh and try again.');
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

  const handlePrintTodayRunSheet = () => {
    // Implement logic to print today's run sheet
    toast.success("Printing today's run sheet...");
    // You might want to open a new window with a printable version of the run sheet
  };

  const handlePrintWeekSummary = () => {
    // Implement logic to generate and print this week's summary
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    // Fetch data for the week and generate a summary
    toast.success(`Generating this week's summary: ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`);
  };

  const handlePrintTodayLabels = () => {
    // Implement logic to print today's labels
    toast.success("Printing today's labels...");
    // This might involve generating a PDF with labels for each meal
  };

  const handleExportWeeklyExcel = () => {
    // Implement logic to export weekly data to Excel
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    // Fetch data for the week
    getMealsBetweenDates(weekStart, weekEnd).then(weeklyMeals => {
      // Process data for Excel
	  console.log(weeklyMeals);
      const wsData = [
        ['Date', 'Main Course', 'Quantity', 'Add-ons', 'Total Meals'],
        // Add rows based on weeklyMeals data
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Weekly Summary");
      XLSX.writeFile(wb, "weekly_meal_summary.xlsx");
      toast.success("Weekly summary exported to Excel");
    }).catch(error => {
      console.error('Error exporting to Excel:', error);
      toast.error("Failed to export weekly summary");
    });
  };

  const handleExportMonthlyReport = () => {
    // Similar to weekly export, but for the entire month
    toast.success("Exporting monthly report...");
  };

	const renderMealCard = (meal: any) => (
		<div
			key={meal.id}
			className="bg-white p-4 rounded-lg shadow mb-4"
		>
			<div className="font-bold text-lg mb-2">{formatDate(meal.deliveryDate)}</div>
			<div className="grid grid-cols-2 gap-2">
				<div>
					<span className="font-semibold">Child:</span> {meal.child.name || 'N/A'}
				</div>
				<div>
					<span className="font-semibold">Year:</span> {meal.child.year || 'N/A'}
				</div>
				<div>
					<span className="font-semibold">Class:</span> {meal.child.className || 'N/A'}
				</div>
				<div>
					<span className="font-semibold">School:</span> {meal.school.name || 'N/A'}
				</div>
				<div className="col-span-2">
					<span className="font-semibold">Main Dish:</span> {meal.main.display || 'N/A'}
				</div>
				<div className="col-span-2">
					<span className="font-semibold">Add-ons:</span> {formatAddOns(meal.addOns)}
				</div>
			</div>
		</div>
	);

	return (
		<div className="w-full p-4 space-y-4">
			<div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Run Sheet</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default">
              <PrinterIcon className="mr-2 h-4 w-4" />
              Print / Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handlePrintTodayRunSheet}>
              <PrinterIcon className="mr-2 h-4 w-4" />
              Print Today's Run Sheet
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePrintWeekSummary}>
              <PrinterIcon className="mr-2 h-4 w-4" />
              Print This Week's Summary
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePrintTodayLabels}>
              <PrinterIcon className="mr-2 h-4 w-4" />
              Print Today's Labels
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportWeeklyExcel}>
              <FileSpreadsheetIcon className="mr-2 h-4 w-4" />
              Export Weekly Summary (Excel)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportMonthlyReport}>
              <FileSpreadsheetIcon className="mr-2 h-4 w-4" />
              Export Monthly Report (Excel)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

			<div className="flex flex-col sm:flex-row gap-4 mb-4">
				<Select
					value={quickSelect}
					onValueChange={handleQuickSelect}
					disabled={isLoading}
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

				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className={`w-full sm:w-[300px] bg-white justify-start text-left font-normal ${
								quickSelect !== 'custom' || isLoading ? 'opacity-50 cursor-not-allowed' : ''
							}`}
							disabled={quickSelect !== 'custom' || isLoading}
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
							onSelect={handleCustomDateChange}
							numberOfMonths={2}
							disabled={isLoading}
						/>
					</PopoverContent>
				</Popover>

				<Select
					value={selectedSchool}
					onValueChange={handleSchoolSelect}
					disabled={isLoading}
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

			{isLoading ? (
				<div className="flex justify-center items-center h-40">
					<Loader2 className="h-8 w-8 animate-spin text-brand-dark-green" />
				</div>
			) : meals.length === 0 ? (
				<div className="text-center py-4">No meals found</div>
			) : (
				<>
					{/* Mobile view */}
					<div className="md:hidden">{meals.map(renderMealCard)}</div>

					{/* Desktop view */}
					<div className="hidden md:block rounded-md border bg-white">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Date</TableHead>
									<TableHead>Child</TableHead>
									<TableHead className="text-center">Year</TableHead>
									<TableHead className="text-center">Class</TableHead>
									<TableHead>School</TableHead>
									<TableHead>Main Dish</TableHead>
									<TableHead>Add-ons</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{meals.map((meal) => (
									<TableRow key={meal.id}>
										<TableCell>{formatDate(meal.deliveryDate)}</TableCell>
										<TableCell>{meal.child.name || 'N/A'}</TableCell>
										<TableCell className="text-center">{meal.child.year || 'N/A'}</TableCell>
										<TableCell className="text-center">{meal.child.className || 'N/A'}</TableCell>
										<TableCell>{meal.school.name || 'N/A'}</TableCell>
										<TableCell>{meal.main.display || 'N/A'}</TableCell>
										<TableCell>{formatAddOns(meal.addOns)}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</>
			)}
		</div>
	);
};

export default RunSheet;
