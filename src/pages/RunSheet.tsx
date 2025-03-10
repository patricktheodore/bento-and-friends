import React, { useState, useEffect } from 'react';
import { getMealsBetweenDates } from '../services/run-sheet-operations';
import { useAppContext } from '../context/AppContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
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
import { Meal } from '@/models/order.model';

interface jsPDFWithPlugin extends jsPDF {
	autoTable: (options: UserOptions) => jsPDF;
}

const RunSheet: React.FC = () => {
	const { state } = useAppContext();
	const [meals, setMeals] = useState<any[]>([]);
	const [dateRange, setDateRange] = useState<DateRange>({
		from: new Date(),
		to: new Date(),
	});
	const [selectedSchool, setSelectedSchool] = useState<string>('all');
	const [isLoading, setIsLoading] = useState(false);
	const [quickSelect, setQuickSelect] = useState('today');
	const [sortedMeals, setSortedMeals] = useState<any[]>([]);
	
	const groupMealsByDateAndSchool = (meals: any[]) => {
		return meals.reduce((acc, meal) => {
			const date = formatDate(meal.deliveryDate);
			const school = meal.school.name;
			if (!acc[date]) acc[date] = {};
			if (!acc[date][school]) acc[date][school] = [];
			acc[date][school].push(meal);
			return acc;
		}, {});
	};

	// In your component:
	const [groupedMeals, setGroupedMeals] = useState<Record<string, Record<string, any[]>>>({});

	useEffect(() => {
		const grouped = groupMealsByDateAndSchool(sortedMeals);
		setGroupedMeals(grouped);
	}, [sortedMeals]);

	useEffect(() => {
		handleQuickSelect('today');
	}, []);

	useEffect(() => {
		if (sortedMeals.length > 0) {
			const groupedMeals = groupMealsByDateAndSchool(sortedMeals);
			setGroupedMeals(groupedMeals);
		}
	}, [sortedMeals]);

	// Unified sorting function that handles all sorting aspects
	const sortMeals = (mealsToSort: any[]): any[] => {
		return mealsToSort.sort((a, b) => {
			// Sort by Date
			const dateA =
				a.deliveryDate instanceof Timestamp
					? a.deliveryDate.toDate().getTime()
					: new Date(a.deliveryDate).getTime();
			const dateB =
				b.deliveryDate instanceof Timestamp
					? b.deliveryDate.toDate().getTime()
					: new Date(b.deliveryDate).getTime();
			if (dateA !== dateB) {
				return dateA - dateB;
			}

			// Sort by School
			const schoolA = a.school.name.toLowerCase();
			const schoolB = b.school.name.toLowerCase();
			if (schoolA !== schoolB) {
				return schoolA.localeCompare(schoolB);
			}

			// Sort by Year
			// const yearA = parseInt(a.child.year) || 0;
			// const yearB = parseInt(b.child.year) || 0;
			// if (yearA !== yearB) {
			// 	return yearA - yearB;
			// }

			// Sort by Class - properly handle numeric class names
			const classA = a.child.className || '';
			const classB = b.child.className || '';
			
			// Try to parse as numbers first
			const classANum = parseInt(classA);
			const classBNum = parseInt(classB);
			
			// If both are valid numbers, compare them numerically
			if (!isNaN(classANum) && !isNaN(classBNum)) {
				return classANum - classBNum;
			}
			
			// Otherwise use string comparison
			return classA.localeCompare(classB);
		});
	};

	// Filter meals by school and then apply sorting
	const filterMealsBySchool = (school: string, mealsToFilter = meals) => {
		if (school === 'all') {
			setSortedMeals(sortMeals(mealsToFilter));
		} else {
			const filtered = mealsToFilter.filter((meal) => meal.school.name === school);
			setSortedMeals(sortMeals(filtered));
		}
	};

	const handleQuickSelect = (option: string) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		let newRange: DateRange | undefined;

		switch (option) {
			case 'today':
				newRange = { from: today, to: today };
				break;
			case 'tomorrow':
				const tomorrow = new Date(today);
				tomorrow.setDate(tomorrow.getDate() + 1);
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

	// Updated handleSchoolSelect
	const handleSchoolSelect = (school: string) => {
		setSelectedSchool(school);
		// Use the new school directly
		filterMealsBySchool(school, meals);
	};

	// Updated handleSearch
	const handleSearch = async (range: DateRange = dateRange) => {
		if (!range.from) return;

		setIsLoading(true);
		const startDate = range.from;
		const endDate = range.to || range.from;

		try {
			const fetchedMeals = await getMealsBetweenDates(startDate, endDate);
			setMeals(fetchedMeals);
			
			// Apply current school filter
			filterMealsBySchool(selectedSchool, fetchedMeals);
		} catch (error) {
			console.error('Error fetching meals:', error);
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

	const formatFruitYogurt = (yogurt:string, fruit:string) => {
		if (!yogurt && !fruit) return 'N/A';

		return `${yogurt} | ${fruit}`
	}

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
			`Date Range: ${format(dateRange.from!, 'MMM d, yyyy')} - ${format(
				dateRange.to || dateRange.from!,
				'MMM d, yyyy'
			)}`,
			pageWidth / 2,
			yOffset,
			{ align: 'center' }
		);
		yOffset += 15;

		Object.entries(groupedMeals).forEach(([date, schools]) => {
			pdf.setFontSize(12);
			pdf.setFont('helvetica', 'bold');
			pdf.text(`Date: ${date}`, 10, yOffset);
			yOffset += 7;

			Object.entries(schools).forEach(([school, meals]) => {
				pdf.setFont('helvetica', 'normal');
				pdf.text(`School: ${school}`, 10, yOffset);
				yOffset += 7;

				const mealData = meals.map((meal) => [
					meal.child.name || 'N/A',
					meal.child.year || 'Staff',
					meal.child.className || 'SR',
					meal.main.display || 'N/A',
					meal.allergens || 'N/A',
					formatFruitYogurt(meal.probiotic?.display ?? '', meal.fruit?.display ?? ''),
					formatAddOns(meal.addOns),
				]);

				pdf.autoTable({
					startY: yOffset,
					head: [['Child', 'Year', 'Class', 'Main Dish', 'Allergies', 'Probitic | Fruit', 'Add-ons']],
					body: mealData,
					headStyles: { fillColor: [5, 45, 42] },
					styles: { cellPadding: 2, fontSize: 8 },
				});

				yOffset = (pdf as any).lastAutoTable.finalY + 10;

				if (yOffset > pdf.internal.pageSize.height - 20) {
					pdf.addPage();
					yOffset = 10;
				}
			});
		});

		pdf.save('run-sheet.pdf');
		toast.success('Run sheet PDF generated and downloaded.');
	};

	const handlePrintLabels = () => {
		const pdf = new jsPDF({
			orientation: 'portrait',
			unit: 'mm',
			format: 'a4',
		}) as jsPDFWithPlugin;
	
		const pageHeight = 297;
	
		// Label dimensions and layout
		const labelWidth = 38.1;
		const labelHeight = 21.2;
		const labelsPerRow = 5;
		const labelsPerCol = 13;
	
		// Specified margins and gaps
		const marginTop = 10.2;
		const marginLeft = 4.6;
		const gapHorizontal = 2.5;
		const marginBottom = marginTop;
	
		// Calculate vertical gap
		const totalLabelHeight = labelsPerCol * labelHeight;
		const availableVerticalSpace = pageHeight - marginTop - marginBottom;
		const gapVertical = (availableVerticalSpace - totalLabelHeight) / (labelsPerCol - 1);
	
		// Inner padding for text
		const paddingLeft = 2;
		const paddingTop = 1;
	
		let labelIndex = 0;
	
		// Function to get the first letter or a star for Surprise
		const getInitialOrStar = (text: string | undefined): string => {
			if (!text) return '';
			
			// Check if it's a "Surprise" yogurt/fruit
			if (text.toLowerCase().includes('surprise') || text.toLowerCase().includes('mixed')) {
				return '?';
			}
			
			// Otherwise return the first letter
			return text.charAt(0).toUpperCase();
		};
	
		Object.entries(groupedMeals).forEach(([_, schools]) => {
			Object.entries(schools).forEach(([school, meals]) => {
				meals.forEach((meal) => {
					if (labelIndex > 0 && labelIndex % (labelsPerRow * labelsPerCol) === 0) {
						pdf.addPage();
					}
	
					const col = labelIndex % labelsPerRow;
					const row = Math.floor((labelIndex % (labelsPerRow * labelsPerCol)) / labelsPerRow);
	
					const x = marginLeft + col * (labelWidth + gapHorizontal);
					const y = marginTop + row * (labelHeight + gapVertical);
	
					// Add yogurt indicator to top right
					if (meal.probiotic?.display) {
						pdf.setFont('helvetica', 'bold');
						pdf.setFontSize(10);
						const yogurtSymbol = getInitialOrStar(meal.probiotic.display);
						// Position in top right corner
						pdf.text(yogurtSymbol, x + labelWidth - 3, y + paddingTop + 4);
					}
	
					// Add fruit indicator to bottom right
					if (meal.fruit?.display) {
						pdf.setFont('helvetica', 'bold');
						pdf.setFontSize(10);
						const fruitSymbol = getInitialOrStar(meal.fruit.display);
						// Position in bottom right corner
						pdf.text(fruitSymbol, x + labelWidth - 3, y + labelHeight - 3);
					}
	
					// Student Name (Bold)
					pdf.setFont('helvetica', 'bold');
					pdf.setFontSize(8);
					pdf.text(meal.child.name, x + paddingLeft, y + paddingTop + 4);
	
					// School (Normal, abbreviated if necessary)
					pdf.setFont('helvetica', 'normal');
					pdf.setFontSize(6);
					const schoolAbbr = school.length > 20 ? school.substring(0, 18) + '...' : school;
					pdf.text(schoolAbbr, x + paddingLeft, y + paddingTop + 8);
	
					var locationText = `Year ${meal.child.year} Class ${meal.child.className}`;
					if (!meal.child.year || !meal.child.className) {
						locationText = 'Staff Room';
					}
	
					pdf.text(
						locationText,
						x + paddingLeft,
						y + paddingTop + 11
					);
	
					// Main Dish (truncate if too long)
					pdf.setFontSize(6);
					const mainDish =
						meal.main.display.length > 30 ? meal.main.display.substring(0, 28) + '...' : meal.main.display;
					pdf.text(mainDish, x + paddingLeft, y + paddingTop + 15);
	
					// Add-ons (if space allows)
					if (meal.addOns && meal.addOns.length > 0) {
						pdf.setFontSize(6);
						const addOnsText = formatAddOns(meal.addOns);
						if (addOnsText.length <= 35) {
							pdf.text(addOnsText, x + paddingLeft, y + paddingTop + 19);
						} else {
							pdf.text(addOnsText.substring(0, 33) + '...', x + paddingLeft, y + paddingTop + 19);
						}
					}
	
					labelIndex++;
				});
			});
		});
	
		pdf.save('meal-labels.pdf');
		toast.success('Meal labels PDF generated and downloaded.');
	}

	const handlePrintMainDishSummary = () => {
		const pdf = new jsPDF({
			orientation: 'portrait',
			unit: 'mm',
			format: 'a4',
		}) as jsPDFWithPlugin;
	
		let yOffset = 10;
	
		// Process meals by date, school, and main dish
		Object.entries(groupedMeals).forEach(([date, schools]) => {
			pdf.setFontSize(14);
			pdf.setFont('helvetica', 'bold');
			pdf.text(`Date: ${date}`, 10, yOffset);
			yOffset += 10;
	
			// Process each school
			Object.entries(schools).forEach(([school, schoolMeals]) => {
				// Create a summary of main dishes for this school
				const mainDishSummary: Record<string, { count: number, variations: { count: number, description: string }[] }> = {};
				
				// Process meals and group by main dish and variations
				schoolMeals.forEach((meal) => {
					const mainDish = meal.main.display;
					const allergens = meal.allergens || '';
					const addOns = meal.addOns?.map((addOn: any) => addOn.display).join(', ') || '';
					
					// Create a variation description
					let variationDesc = '';
					if (allergens) variationDesc += `Allergens: ${allergens}`;
					if (addOns) {
						if (variationDesc) variationDesc += ' | ';
						variationDesc += `Add-ons: ${addOns}`;
					}
					if (!variationDesc) variationDesc = 'Standard';
					
					// Initialize the main dish entry if it doesn't exist
					if (!mainDishSummary[mainDish]) {
						mainDishSummary[mainDish] = { count: 0, variations: [] };
					}
					
					// Increment the total count for this main dish
					mainDishSummary[mainDish].count++;
					
					// Find or create the variation
					const existingVariation = mainDishSummary[mainDish].variations.find(v => v.description === variationDesc);
					if (existingVariation) {
						existingVariation.count++;
					} else {
						mainDishSummary[mainDish].variations.push({ count: 1, description: variationDesc });
					}
				});
	
				// Display the school header
				pdf.setFontSize(12);
				pdf.setFont('helvetica', 'bold');
				pdf.text(`School: ${school}`, 10, yOffset);
				yOffset += 8;
	
				// Prepare table data for this school
				const tableRows: any[] = [];
	
				// Convert the summary to table rows
				Object.entries(mainDishSummary).forEach(([mainDish, summary]) => {
					// Add the main dish row
					tableRows.push([
						{ content: mainDish, colSpan: 2, styles: { fontStyle: 'bold' } },
						{ content: `x${summary.count}`, styles: { fontStyle: 'bold', halign: 'center' } }
					]);
					
					// Add each variation as a row
					summary.variations.forEach(variation => {
						tableRows.push([
							{ content: '', styles: { cellWidth: 5 } },
							{ content: variation.description, styles: { fontSize: 8 } },
							{ content: `x${variation.count}`, styles: { halign: 'center' } }
						]);
					});
					
					// Add an empty row for spacing between main dish groups
					tableRows.push([{ content: '', colSpan: 3 }]);
				});
	
				// Create the table if we have data
				if (tableRows.length > 0) {
					pdf.autoTable({
						startY: yOffset,
						head: [[
							{ content: 'Main Dish', colSpan: 2 },
							{ content: 'Count' }
						]],
						body: tableRows,
						headStyles: { fillColor: [5, 45, 42], halign: 'left' },
						theme: 'grid',
						columnStyles: {
							0: { cellWidth: 5 },
							1: { cellWidth: 'auto' },
							2: { cellWidth: 15 }
						},
						margin: { left: 10, right: 10 },
						tableWidth: 'auto',
						styles: { cellPadding: 2, fontSize: 9 }
					});
	
					yOffset = (pdf as any).lastAutoTable.finalY + 10;
				}
	
				// Check if we need a new page for the next school
				if (yOffset > pdf.internal.pageSize.height - 30) {
					pdf.addPage();
					yOffset = 10;
				}
			});
	
			// Add a page break between dates if there's more content
			if (yOffset > pdf.internal.pageSize.height - 40) {
				pdf.addPage();
				yOffset = 10;
			} else {
				yOffset += 10;
			}
		});
	
		pdf.save('main-dish-summary.pdf');
		toast.success('Main Dish Summary generated and downloaded.');
	}

	const handlePrintClassBreakdown = () => {
		const pdf = new jsPDF({
			orientation: 'landscape',
			unit: 'mm',
			format: 'a4',
		}) as jsPDFWithPlugin;
	
		let yOffset = 10;
	
		// Process meals by date
		Object.entries(groupedMeals).forEach(([date, schools]) => {
			pdf.setFontSize(14);
			pdf.setFont('helvetica', 'bold');
			pdf.text(`Date: ${date}`, 10, yOffset);
			yOffset += 10;
	
			// For each date, create a breakdown by school and class
			Object.entries(schools).forEach(([school, schoolMeals]) => {
				// Add school name as a title above the table
				pdf.setFontSize(12);
				pdf.setFont('helvetica', 'bold');
				pdf.text(`${school}`, 10, yOffset);
				yOffset += 8;
	
				// Group meals by class for this school
				const classCounts: Record<string, number> = {};
				
				// Get unique classes and count meals
				schoolMeals.forEach((meal) => {
					const classKey = meal.child.className || 'Staff Room'; // Use "Staff Room" for null class names
					classCounts[classKey] = (classCounts[classKey] || 0) + 1;
				});
	
				// Sort class names appropriately
				const classNames = Object.keys(classCounts).sort((a, b) => {
					// Try to sort numerically first
					const numA = parseInt(a);
					const numB = parseInt(b);
					
					if (!isNaN(numA) && !isNaN(numB)) {
						return numA - numB;
					}
					
					// If one is "Staff Room", put it at the end
					if (a === 'Staff Room') return 1;
					if (b === 'Staff Room') return -1;
					
					// Otherwise sort alphabetically
					return a.localeCompare(b);
				});
	
				// Create the table header (Class, Qty)
				const headers = ['Class', ...classNames, 'Total'];
				
				// Create row with quantities
				const countRow = ['Qty', ...classNames.map(cls => classCounts[cls].toString()), schoolMeals.length.toString()];
				
				// Create the table
				pdf.autoTable({
					startY: yOffset,
					head: [headers],
					body: [countRow],
					headStyles: { 
						fillColor: [5, 45, 42],
						halign: 'center',
						valign: 'middle'
					},
					bodyStyles: {
						halign: 'center'
					},
					columnStyles: {
						0: { fontStyle: 'bold', halign: 'left' }
					},
					theme: 'grid',
					tableWidth: 'auto',
					margin: { left: 10, right: 10 },
					styles: { cellPadding: 3, fontSize: 9 }
				});
	
				yOffset = (pdf as any).lastAutoTable.finalY + 10;
	
				// Add a small gap between schools
				if (yOffset > pdf.internal.pageSize.height - 20) {
					pdf.addPage();
					yOffset = 10;
				}
			});
	
			yOffset += 10;
			
			// Add a page break between dates if needed
			if (yOffset > pdf.internal.pageSize.height - 40) {
				pdf.addPage();
				yOffset = 10;
			}
		});
	
		pdf.save('class-breakdown.pdf');
		toast.success('Class Breakdown generated and downloaded.');
	}

	const today = new Date();
  	const tomorrow = addDays(today, 1);

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
					<span className="font-semibold">Year:</span> {meal.child.year || 'Staff'}
				</div>
				<div>
					<span className="font-semibold">Class:</span> {meal.child.className || 'SR'}
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
				<div>
					<span className="font-semibold">Probiotic: {meal.probiotic ? meal.probiotic.display : 'N/A' }</span>
				</div>
				<div>
					<span className="font-semibold">Fruit: {meal.fruit ? meal.fruit.display : 'N/A' }</span>
				</div>
			</div>
		</div>
	);

	const TableHeaderRow = () => (
		<TableRow>
			<TableHead>Child</TableHead>
			<TableHead className="text-center">Year</TableHead>
			<TableHead className="text-center">Class</TableHead>
			<TableHead>Main Dish</TableHead>
			<TableHead>Allergies</TableHead>
			<TableHead>Add-ons</TableHead>
			<TableHead>Probiotic / Fruit</TableHead>
		</TableRow>
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
						<DropdownMenuItem onClick={handlePrintMainDishSummary}>
							<PrinterIcon className="mr-2 h-4 w-4" />
							Print Main Dish Summary
						</DropdownMenuItem>
						<DropdownMenuItem onClick={handlePrintClassBreakdown}>
							<PrinterIcon className="mr-2 h-4 w-4" />
							Print Class Breakdown
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
						<SelectItem value="today">Today ({format(today, 'MMM d')})</SelectItem>
						<SelectItem value="tomorrow">Tomorrow ({format(tomorrow, 'MMM d')})</SelectItem>
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
								value={school.name}
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
					<RunSheetSummary meals={sortedMeals} />

					{/* Mobile view */}
					<h3 className="text-2xl font-semibold mb-4">Detailed Meal List</h3>
					<div className="md:hidden">{sortedMeals.map(renderMealCard)}</div>

					{/* Desktop view */}
					<div className="hidden md:block rounded-md border bg-white">
						<Table>
							<TableBody>
								{Object.entries(groupedMeals).map(([date, schools]) => (
									<React.Fragment key={date}>
										<TableRow>
											<TableCell
												colSpan={7}
												className="font-bold bg-gray-100"
											>
												{date}
											</TableCell>
										</TableRow>
										{Object.entries(schools).map(([school, meals]) => (
											<React.Fragment key={school}>
												<TableRow>
													<TableCell
														colSpan={7}
														className="font-semibold bg-gray-50"
													>
														{school}
													</TableCell>
												</TableRow>
												<TableHeaderRow />
												{meals.map((meal) => (
													<TableRow key={meal.id}>
														<TableCell>{meal.child.name || 'N/A'}</TableCell>
														<TableCell className="text-center">
															{meal.child.year || 'Staff'}
														</TableCell>
														<TableCell className="text-center">
															{meal.child.className || 'SR'}
														</TableCell>
														<TableCell>{meal.main.display || 'N/A'}</TableCell>
														<TableCell>{meal.allergens}</TableCell>
														<TableCell>{formatAddOns(meal.addOns)}</TableCell>
														<TableCell>{meal.probiotic ? meal.probiotic.display : 'N/A'} | {meal.fruit ? meal.fruit.display : 'N/A'}</TableCell>
													</TableRow>
												))}
											</React.Fragment>
										))}
									</React.Fragment>
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