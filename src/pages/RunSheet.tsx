import React, { useState, useEffect } from 'react';
import { getMealsBetweenDates } from '../services/run-sheet-operations';
import { useAppContext } from '../context/AppContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks } from 'date-fns';
import { CalendarIcon, Loader2, PrinterIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import RunSheetSummary from '@/components/RunSheetSummary';

interface jsPDFWithPlugin extends jsPDF {
	autoTable: (options: UserOptions) => jsPDF;
}

interface MealVariation {
	count: number;
	allergens: string[];
	addOns: string[];
	hasAllergens: boolean;
}

type VariationEntry = [string, MealVariation];
type MainDishEntry = [string, VariationEntry[], number];

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

	const handlePrintRunSheet = () => {
		const pdf = new jsPDF({
		  orientation: 'landscape',
		  unit: 'mm',
		  format: 'a4',
		}) as jsPDFWithPlugin;
	
		const pageWidth = pdf.internal.pageSize.width;
		let yOffset = 10;
	
		// Add title
		pdf.setFontSize(18);
		pdf.text('Run Sheet Summary', pageWidth / 2, yOffset, { align: 'center' });
		yOffset += 10;
	
		// Add date range
		pdf.setFontSize(12);
		pdf.text(
		  `Date Range: ${format(dateRange.from!, 'MMM d, yyyy')} - ${format(dateRange.to || dateRange.from!, 'MMM d, yyyy')}`,
		  pageWidth / 2,
		  yOffset,
		  { align: 'center' }
		);
		yOffset += 15;
	
		// Process meals data
		const sortedSummary = processMenuData(meals);
	
		// Create summary table
		const summaryData = sortedSummary.map(([mainDish, variations, totalCount]) => {
		  const variationDetails = variations.map(([_, variation]) => 
			`${variation.count}x ${formatVariation(variation)}`
		  ).join('\n');
		  return [mainDish, totalCount.toString(), variationDetails];
		});
	
		pdf.autoTable({
		  startY: yOffset,
		  head: [['Main Dish', 'Total', 'Variations']],
		  body: summaryData,
		  headStyles: { fillColor: [5, 45, 42] },
		  columnStyles: {
			0: { cellWidth: 60 },
			1: { cellWidth: 20 },
			2: { cellWidth: 'auto' },
		  },
		  styles: { cellPadding: 2, fontSize: 10 },
		  bodyStyles: { valign: 'top' },
		});
	
		// Add detailed meal list
		pdf.addPage();
		pdf.setFontSize(14);
		pdf.text('Detailed Meal List', pageWidth / 2, 10, { align: 'center' });
	
		const mealData = meals.map((meal) => [
		  formatDate(meal.deliveryDate),
		  meal.child.name || 'N/A',
		  meal.child.year || 'N/A',
		  meal.child.className || 'N/A',
		  meal.school.name || 'N/A',
		  meal.main.display || 'N/A',
		  meal.allergens || 'N/A',
		  formatAddOns(meal.addOns),
		]);
	
		pdf.autoTable({
		  startY: 20,
		  head: [['Date', 'Child', 'Year', 'Class', 'School', 'Main Dish', 'Allergies', 'Add-ons']],
		  body: mealData,
		  headStyles: { fillColor: [5, 45, 42] },
		  columnStyles: {
			0: { cellWidth: 25 },
			1: { cellWidth: 40 },
			2: { cellWidth: 15 },
			3: { cellWidth: 20 },
			4: { cellWidth: 50 },
			5: { cellWidth: 50 },
			6: { cellWidth: 30 },
			7: { cellWidth: 'auto' },
		  },
		});
	
		pdf.save('run-sheet.pdf');
		toast.success('Run sheet PDF generated and downloaded.');
	  };
	
	const processMenuData = (meals: any[]): MainDishEntry[] => {
	const mealGroups: { [key: string]: { [key: string]: MealVariation } } = {};

	meals.forEach((meal) => {
		const mainDish = meal.main.display;
		const allergens: string[] = meal.allergens ? [meal.allergens] : [];
		const addOns: string[] = meal.addOns?.map((addOn: any) => addOn.display) || [];
		const hasAllergens = allergens.length > 0;

		const variationKey = [...allergens, ...addOns].sort().join(', ') || 'No changes';

		if (!mealGroups[mainDish]) {
		mealGroups[mainDish] = {};
		}

		if (!mealGroups[mainDish][variationKey]) {
		mealGroups[mainDish][variationKey] = { count: 0, allergens, addOns, hasAllergens };
		}

		mealGroups[mainDish][variationKey].count++;
	});

	return Object.entries(mealGroups).map(([mainDish, variations]): MainDishEntry => {
		const sortedVariations = Object.entries(variations).sort((a, b) => {
		const [, varA] = a;
		const [, varB] = b;

		if (varA.allergens.length === 0 && varA.addOns.length === 0) return -1; // "No changes" always first
		if (varB.allergens.length === 0 && varB.addOns.length === 0) return 1;

		if (varA.hasAllergens && !varB.hasAllergens) return 1;
		if (!varA.hasAllergens && varB.hasAllergens) return -1;

		return 0;
		});

		const totalCount = Object.values(variations).reduce((sum, variation) => sum + variation.count, 0);

		return [mainDish, sortedVariations, totalCount];
	});
	};

	const formatVariation = (variation: MealVariation): string => {
	const parts: string[] = [];
	if (variation.allergens.length > 0) {
		parts.push(`Allergens: ${variation.allergens.join(', ')}`);
	}
	if (variation.addOns.length > 0) {
		parts.push(`Add-ons: ${variation.addOns.join(', ')}`);
	}
	return parts.join(' | ') || 'No changes';
	};

	const handlePrintLabels = () => {
		const pdf = new jsPDF({
		  orientation: 'portrait',
		  unit: 'mm',
		  format: 'a4',
		}) as jsPDFWithPlugin;
	
		const pageWidth = 210;  // A4 width in mm
		const pageHeight = 297; // A4 height in mm
		const labelWidth = 38.1;
		const labelHeight = 21.2;
		const labelsPerRow = 5;
		const labelsPerCol = 13;
		const marginLeft = (pageWidth - (labelsPerRow * labelWidth)) / 2;
		const marginTop = (pageHeight - (labelsPerCol * labelHeight)) / 2;
		const padding = 2; // Increased padding
	
		meals.forEach((meal, index) => {
		  if (index > 0 && index % 65 === 0) {
			pdf.addPage();
		  }
	
		  const col = index % labelsPerRow;
		  const row = Math.floor((index % 65) / labelsPerRow);
	
		  const x = marginLeft + (col * labelWidth) + padding;
		  const y = marginTop + (row * labelHeight) + padding;
	
		  // Student Name (Bold)
		  pdf.setFont('helvetica', 'bold');
		  pdf.setFontSize(8);
		  pdf.text(meal.child.name, x, y + 5, { maxWidth: labelWidth - (padding * 2) });
		  
		  // School, Year, and Class (Normal)
		  pdf.setFont('helvetica', 'normal');
		  pdf.setFontSize(6);
		  const schoolYearClass = `${meal.school.name} Year ${meal.child.year} Class ${meal.child.className}`;
		  pdf.text(schoolYearClass, x, y + 10, { maxWidth: labelWidth - (padding * 2) });
		  
		  // Meal and Add-ons (Normal)
		  const mealText = `${meal.main.display}${meal.addOns.length > 0 ? ` + ${formatAddOns(meal.addOns)}` : ''}`;
		  pdf.text(mealText, x, y + 15, { maxWidth: labelWidth - (padding * 2) });
		});
	
		pdf.save('meal-labels.pdf');
		toast.success("Meal labels PDF generated and downloaded.");
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
						<DropdownMenuItem onClick={handlePrintRunSheet}>
							<PrinterIcon className="mr-2 h-4 w-4" />
							Print Run Sheet Summary
						</DropdownMenuItem>
						<DropdownMenuItem onClick={handlePrintLabels}>
							<PrinterIcon className="mr-2 h-4 w-4" />
							Print Labels
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
					<h3 className="text-2xl font-semibold mb-4">Run Sheet Summary</h3>
					<RunSheetSummary meals={meals} />

					{/* Mobile view */}
					<h3 className="text-2xl font-semibold mb-4">Detailed Meal List</h3>
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
									<TableHead>Allergies / Dietaries</TableHead>
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
										<TableCell>{meal.allergens}</TableCell>
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
