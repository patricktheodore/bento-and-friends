import React, { useState, useEffect } from 'react';
import { getMealsBetweenDates, getMealsPlacedAfterDate, MealWithId } from '../services/run-sheet-operations';
import { useAppContext } from '../context/AppContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks } from 'date-fns';
import {
	CalendarIcon,
	Loader2,
	PrinterIcon,
	FileText,
	Tags,
	Users,
	ChefHat,
	GraduationCap,
	Clock,
	AlertCircle,
	
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
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



import MissingLabelsDialog from '@/components/MissingLabelsDialog';

interface jsPDFWithPlugin extends jsPDF {
	autoTable: (options: UserOptions) => jsPDF;
}

const RunSheet: React.FC = () => {
	const { state } = useAppContext();
	const [meals, setMeals] = useState<MealWithId[]>([]);
	const [dateRange, setDateRange] = useState<DateRange>({
		from: new Date(),
		to: new Date(),
	});
	const [selectedSchool, setSelectedSchool] = useState<string>('all');
	const [isLoading, setIsLoading] = useState(false);
	const [quickSelect, setQuickSelect] = useState('today');
	const [sortedMeals, setSortedMeals] = useState<MealWithId[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [showMissingLabelsDialog, setShowMissingLabelsDialog] = useState(false);
	const [isMissingLabelsLoading, setIsMissingLabelsLoading] = useState(false);

	const groupMealsByDateAndSchool = (meals: MealWithId[]) => {
		return meals.reduce(
			(acc, meal) => {
				const date = formatDate(meal.deliveryDate);
				const school = meal.schoolName;
				if (!acc[date]) acc[date] = {};
				if (!acc[date][school]) acc[date][school] = [];
				acc[date][school].push(meal);
				return acc;
			},
			{} as Record<string, Record<string, MealWithId[]>>
		);
	};

	const [groupedMeals, setGroupedMeals] = useState<Record<string, Record<string, MealWithId[]>>>({});

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

	
	const sortMeals = (mealsToSort: MealWithId[]): MealWithId[] => {
		return mealsToSort.sort((a, b) => {
			
			const dateA = new Date(a.deliveryDate);
			const dateB = new Date(b.deliveryDate);
			if (dateA.getTime() !== dateB.getTime()) {
				return dateA.getTime() - dateB.getTime();
			}

			
			const schoolA = a.schoolName.toLowerCase();
			const schoolB = b.schoolName.toLowerCase();
			if (schoolA !== schoolB) {
				return schoolA.localeCompare(schoolB);
			}

			
			if (a.childIsTeacher !== b.childIsTeacher) {
				return a.childIsTeacher ? 1 : -1;
			}

			
			if (!a.childIsTeacher && !b.childIsTeacher) {
				const yearA = a.childYear || '';
				const yearB = b.childYear || '';
				if (yearA !== yearB) {
					
					const yearANum = parseInt(yearA);
					const yearBNum = parseInt(yearB);
					if (!isNaN(yearANum) && !isNaN(yearBNum)) {
						return yearANum - yearBNum;
					}
					return yearA.localeCompare(yearB);
				}

				
				const classA = a.childClass || '';
				const classB = b.childClass || '';
				if (classA !== classB) {
					return classA.localeCompare(classB);
				}
			}

			
			const childA = a.childName.toLowerCase();
			const childB = b.childName.toLowerCase();
			return childA.localeCompare(childB);
		});
	};

	
	const filterMealsBySchool = (school: string, mealsToFilter = meals) => {
		if (school === 'all') {
			setSortedMeals(sortMeals(mealsToFilter));
		} else {
			const filtered = mealsToFilter.filter((meal) => meal.schoolName === school);
			setSortedMeals(sortMeals(filtered));
		}
	};

	const startOfDay = (date: Date) => {
		const start = new Date(date);
		start.setHours(0, 0, 0, 0);
		return start;
	};

	const endOfDay = (date: Date) => {
		const end = new Date(date);
		end.setHours(23, 59, 59, 999);
		return end;
	};

	const handleQuickSelect = (option: string) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		let newRange: DateRange | undefined;

		switch (option) {
			case 'today':
				newRange = { from: startOfDay(today), to: endOfDay(today) };
				break;
			case 'tomorrow':
				const tomorrow = new Date(today);
				tomorrow.setDate(tomorrow.getDate() + 1);
				newRange = { from: startOfDay(tomorrow), to: endOfDay(tomorrow) };
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

	const handleSchoolSelect = (school: string) => {
		setSelectedSchool(school);
		filterMealsBySchool(school, meals);
	};

	const handleSearch = async (range: DateRange = dateRange) => {
		if (!range.from) return;

		setIsLoading(true);
		setError(null);
		const startDate = range.from;
		const endDate = range.to || range.from;

		try {
			const fetchedMeals = await getMealsBetweenDates(startDate, endDate);
			setMeals(fetchedMeals);
			filterMealsBySchool(selectedSchool, fetchedMeals);
		} catch (error) {
			console.error('Error fetching meals:', error);
			setError('Failed to load run sheet data. Please try again.');
			toast.error('There was an error loading the run sheet for selected dates. Please refresh and try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const formatDate = (date: string): string => {
		const jsDate = new Date(date);
		const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		const dayOfWeek = dayNames[jsDate.getDay()];
		return `${dayOfWeek}, ${jsDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
	};

	const formatAddOns = (addOns: Array<{ id: string; display: string }>) => {
		if (!addOns || !Array.isArray(addOns) || addOns.length === 0) return 'None';
		return addOns.map((addOn) => addOn.display).join(', ');
	};

	const formatSideAndFruit = (sideName: string | null, fruitName: string | null) => {
		const side = sideName || 'N/A';
		const fruit = fruitName || 'N/A';
		return `${side} | ${fruit}`;
	};

	const handlePrintRunSheet = () => {
		const pdf = new jsPDF({
			orientation: 'landscape',
			unit: 'mm',
			format: 'a4',
		}) as jsPDFWithPlugin;

		const pageWidth = pdf.internal.pageSize.width;
		let yOffset = 10;

		
		pdf.setFontSize(18);
		pdf.text('Run Sheet Summary', pageWidth / 2, yOffset, { align: 'center' });
		yOffset += 10;

		
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

		Object.entries(groupedMeals).forEach(([date, schools], dateIndex) => {
			
			if (dateIndex > 0) {
				pdf.addPage();
				yOffset = 10;
			}

			pdf.setFontSize(12);
			pdf.setFont('helvetica', 'bold');
			pdf.text(`Date: ${date}`, 10, yOffset);
			yOffset += 7;

			
			const sortedSchools = Object.entries(schools).sort((a, b) => a[0].localeCompare(b[0]));

			sortedSchools.forEach(([school, meals]) => {
				pdf.setFont('helvetica', 'normal');
				pdf.text(`School: ${school}`, 10, yOffset);
				yOffset += 7;

				const mealData = meals.map((meal) => [
                    meal.childName || 'N/A',
                    meal.childIsTeacher ? 'Staff' : meal.childYear || 'N/A',
                    meal.childIsTeacher ? 'Staff' : meal.childClass || 'N/A',
                    meal.mainName || 'N/A',
                    meal.childAllergens || 'None', 
                    formatSideAndFruit(meal.sideName, meal.fruitName),
                    formatAddOns(meal.addOns),
                ]);

				pdf.autoTable({
					startY: yOffset,
					head: [['Child', 'Year', 'Class', 'Main Dish', 'Allergies', 'Side | Fruit', 'Add-ons']],
					body: mealData,
					headStyles: {
						fillColor: [5, 45, 42],
						fontSize: 8,
						fontStyle: 'bold',
					},
					styles: {
						cellPadding: 2,
						fontSize: 8,
						overflow: 'linebreak', 
						cellWidth: 'wrap',
					},
					
					columnStyles: {
                        0: { cellWidth: 45 }, 
                        1: { cellWidth: 15 }, 
                        2: { cellWidth: 35 }, 
                        3: { cellWidth: 55 }, 
                        4: { cellWidth: 40 }, 
                        5: { cellWidth: 45 }, 
                        6: { cellWidth: 45 }, 
                    },
					
					tableWidth: 'wrap',
					margin: { left: 10, right: 10 },
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

	const handlePrintMissingLabels = () => {
		
		setTimeout(() => {
			setShowMissingLabelsDialog(true);
		}, 50);
	};

	const handleMissingLabelsConfirm = async (startDate: Date) => {
		setIsMissingLabelsLoading(true);

		try {
			
			const currentRangeStart = dateRange.from;
			const currentRangeEnd = dateRange.to || dateRange.from;

			if (!currentRangeStart) {
				toast.error('Please select a date range first');
				return;
			}

			
			const missingMeals = await getMealsPlacedAfterDate(
				startDate,
				currentRangeStart,
				currentRangeEnd ?? currentRangeStart
			);

			
			const filteredMissingMeals =
				selectedSchool === 'all'
					? missingMeals
					: missingMeals.filter((meal) => meal.schoolName === selectedSchool);

			if (filteredMissingMeals.length === 0) {
				toast('No missing labels found for the selected criteria');
				return;
			}

			
			setShowMissingLabelsDialog(false);

			
			handlePrintLabels(filteredMissingMeals);

			toast.success(`Generated ${filteredMissingMeals.length} missing labels`);
		} catch (error) {
			console.error('Error generating missing labels:', error);
			toast.error('Failed to generate missing labels. Please try again.');
		} finally {
			setIsMissingLabelsLoading(false);
		}
	};

	const sortMealsForLabels = (mealsToSort: MealWithId[]): MealWithId[] => {
		return mealsToSort.sort((a, b) => {
			
			const dateA = new Date(a.deliveryDate);
			const dateB = new Date(b.deliveryDate);
			if (dateA.getTime() !== dateB.getTime()) {
				return dateA.getTime() - dateB.getTime();
			}

			
			const schoolA = a.schoolName.toLowerCase();
			const schoolB = b.schoolName.toLowerCase();
			if (schoolA !== schoolB) {
				return schoolA.localeCompare(schoolB);
			}

			
			const mainA = a.mainName.toLowerCase();
			const mainB = b.mainName.toLowerCase();
			if (mainA !== mainB) {
				return mainA.localeCompare(mainB);
			}

			
			const classA = a.childClass || '';
			const classB = b.childClass || '';
			if (classA !== classB) {
				return classA.localeCompare(classB);
			}

			
			const childA = a.childName.toLowerCase();
			const childB = b.childName.toLowerCase();
			return childA.localeCompare(childB);
		});
	};

	const handlePrintLabels = (missingMeals?: MealWithId[]) => {
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        }) as jsPDFWithPlugin;

        const pageHeight = 297;

        
        const labelWidth = 38.1;
        const labelHeight = 21.2;
        const labelsPerRow = 5;
        const labelsPerCol = 13;

        
        const marginTop = 10.2;
        const marginLeft = 4.6;
        const gapHorizontal = 2.5;
        const marginBottom = marginTop;

        
        const totalLabelHeight = labelsPerCol * labelHeight;
        const availableVerticalSpace = pageHeight - marginTop - marginBottom;
        const gapVertical = (availableVerticalSpace - totalLabelHeight) / (labelsPerCol - 1);

        
        const paddingLeft = 2;
        const paddingRight = 2;
        const paddingTop = 0.8;
        const availableWidth = labelWidth - paddingLeft - paddingRight;
        
        
        const lineSpacing = 2.8;

        let labelIndex = 0;

        
        const addTimestampToPage = () => {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7);
            pdf.setTextColor(120, 120, 120);
            const now = new Date();
            const timestamp = now.toLocaleString();
            pdf.text(timestamp, 5, pageHeight - 5);
        };

        const getFruitCode = (text: string) => {
            return state.fruits.find((fruit) => fruit.display === text)?.code || '';
        };

        const getSideCode = (text: string) => {
            return state.sides.find((side) => side.display === text)?.code || '';
        };

        
        const truncateText = (text: string, maxWidth: number, fontSize: number) => {
            pdf.setFontSize(fontSize);
            const textWidth = pdf.getTextWidth(text);
            if (textWidth <= maxWidth) return text;

            let start = 0;
            let end = text.length;
            let result = text;

            while (start <= end) {
                const mid = Math.floor((start + end) / 2);
                const truncated = text.substring(0, mid) + '...';
                const truncatedWidth = pdf.getTextWidth(truncated);

                if (truncatedWidth <= maxWidth) {
                    result = truncated;
                    start = mid + 1;
                } else {
                    end = mid - 1;
                }
            }

            return result;
        };

        
        const sortedMealsForLabels = sortMealsForLabels(missingMeals ?? sortedMeals);

        
        const groupedSortedMeals = sortedMealsForLabels.reduce(
            (acc, meal) => {
                const date = formatDate(meal.deliveryDate);
                const school = meal.schoolName;
                if (!acc[date]) acc[date] = {};
                if (!acc[date][school]) acc[date][school] = [];
                acc[date][school].push(meal);
                return acc;
            },
            {} as Record<string, Record<string, MealWithId[]>>
        );

        
        addTimestampToPage();

        Object.entries(groupedSortedMeals).forEach(([_, schools]) => {
            const sortedSchools = Object.entries(schools).sort((a, b) => a[0].localeCompare(b[0]));

            sortedSchools.forEach(([school, meals]) => {
                meals.forEach((meal) => {
                    if (labelIndex > 0 && labelIndex % (labelsPerRow * labelsPerCol) === 0) {
                        pdf.addPage();
                        addTimestampToPage();
                    }

                    const col = labelIndex % labelsPerRow;
                    const row = Math.floor((labelIndex % (labelsPerRow * labelsPerCol)) / labelsPerRow);

                    const x = marginLeft + col * (labelWidth + gapHorizontal);
                    const y = marginTop + row * (labelHeight + gapVertical);

                    
                    pdf.setDrawColor(180, 180, 180);
                    pdf.setLineWidth(0.1);
                    const cornerSize = 2;

                    
                    pdf.line(x, y, x + cornerSize, y);
                    pdf.line(x, y, x, y + cornerSize);

                    
                    pdf.line(x + labelWidth - cornerSize, y, x + labelWidth, y);
                    pdf.line(x + labelWidth, y, x + labelWidth, y + cornerSize);

                    
                    pdf.line(x, y + labelHeight - cornerSize, x, y + labelHeight);
                    pdf.line(x, y + labelHeight, x + cornerSize, y + labelHeight);

                    
                    pdf.line(x + labelWidth - cornerSize, y + labelHeight, x + labelWidth, y + labelHeight);
                    pdf.line(x + labelWidth, y + labelHeight - cornerSize, x + labelWidth, y + labelHeight);

                    
                    if (meal.sideName) {
                        pdf.setFont('helvetica', 'bold');
                        pdf.setFontSize(9);
                        pdf.setTextColor(100, 100, 100);
                        const sideSymbol = getSideCode(meal.sideName);
                        pdf.text(sideSymbol, x + labelWidth - 1.5, y + paddingTop + 6, { align: 'right' });
                    }

                    
                    if (meal.fruitName) {
                        pdf.setFont('helvetica', 'bold');
                        pdf.setFontSize(9);
                        pdf.setTextColor(100, 100, 100);
                        const fruitSymbol = getFruitCode(meal.fruitName);
                        pdf.text(fruitSymbol, x + labelWidth - 1.5, y + labelHeight - 5, { align: 'right' });
                    }

                    
                    let currentY = y + paddingTop + 3;

                    
                    pdf.setTextColor(0, 0, 0);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(9);
                    const truncatedName = truncateText(meal.childName, availableWidth - 6, 9);
                    pdf.text(truncatedName, x + paddingLeft, currentY);
                    currentY += lineSpacing + 0.5; 

                    
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(5);
                    pdf.setTextColor(80, 80, 80);
                    const truncatedSchool = truncateText(school, availableWidth - 6, 6);
                    pdf.text(truncatedSchool, x + paddingLeft, currentY);
                    currentY += lineSpacing;

                    
                    const locationText = meal.childIsTeacher
                        ? 'Staff Room'
                        : `Y: ${meal.childYear || 'Unknown'}  C: ${meal.childClass || 'Unknown'}`;
                    const truncatedLocation = truncateText(locationText, availableWidth - 6, 6);
                    pdf.text(truncatedLocation, x + paddingLeft, currentY);
                    currentY += lineSpacing;

                    
                    const truncatedMain = truncateText(meal.mainName, availableWidth - 6, 6);
                    pdf.text(truncatedMain, x + paddingLeft, currentY);
                    currentY += lineSpacing;

                    
                    if (meal.addOns && meal.addOns.length > 0) {
                        const addOnsText = formatAddOns(meal.addOns);
                        
                        if (addOnsText !== 'None' && addOnsText.length > 0) {
                            const truncatedAddOns = truncateText(addOnsText, availableWidth - 6, 6);
                            pdf.text(truncatedAddOns, x + paddingLeft, currentY);
                            currentY += lineSpacing;
                        }
                    }

                    
                    if (meal.childAllergens && meal.childAllergens.trim() !== '') {
                        pdf.setTextColor(200, 0, 0);
                        pdf.setFont('helvetica', 'bold');
                        const allergenLines = pdf.splitTextToSize(meal.childAllergens, availableWidth - 2);
                        
                        allergenLines.forEach((line: string, index: number) => {
                            pdf.text(line, x + paddingLeft, currentY + (index * lineSpacing));
                        });
                    }

                    labelIndex++;
                });
            });
        });

        pdf.save('meal-labels.pdf');
        toast.success('Meal labels PDF generated and downloaded.');
    };

	const handlePrintMainDishSummary = () => {
		const pdf = new jsPDF({
			orientation: 'landscape',
			unit: 'mm',
			format: 'a4',
		}) as jsPDFWithPlugin;

		let yOffset = 10;

		
		Object.entries(groupedMeals).forEach(([date, schools], dateIndex) => {
			
			if (dateIndex > 0) {
				pdf.addPage();
				yOffset = 10;
			}

			pdf.setFontSize(14);
			pdf.setFont('helvetica', 'bold');

			
			const pageWidth = pdf.internal.pageSize.width;
			const dateText = `Date: ${date}`;
			const textWidth = pdf.getTextWidth(dateText);
			const centerX = (pageWidth - textWidth) / 2;

			pdf.text(dateText, centerX, yOffset);
			yOffset += 15;

			
			const sortedSchools = Object.entries(schools).sort((a, b) => a[0].localeCompare(b[0]));

			
			sortedSchools.forEach(([schoolName, schoolMeals], schoolIndex) => {
				
				if (schoolIndex > 0) {
					pdf.addPage();
					yOffset = 10;
				}

				const schoolX = 10;
				const schoolWidth = pdf.internal.pageSize.width - 20; 

				
				yOffset = processSchoolMainDishTable(pdf, schoolName, schoolMeals, schoolX, yOffset, schoolWidth);
			});
		});

		pdf.save('main-dish-summary.pdf');
		toast.success('Main Dish Summary generated and downloaded.');
	};

	
	const processSchoolMainDishTable = (
	pdf: jsPDFWithPlugin,
	schoolName: string,
	schoolMeals: any[],
	xOffset: number,
	yOffset: number,
	maxWidth: number
) => {
	// School header
	pdf.setFontSize(11);
	pdf.setFont('helvetica', 'bold');
	pdf.text(`${schoolName}`, xOffset, yOffset);
	yOffset += 8;

	// Group meals by main dish and variation
	const mainDishSummary: Record<string, { count: number; variations: { count: number; allergens: string; addOns: string }[] }> = {};

	// Process meals
	schoolMeals.forEach((meal: MealWithId) => {
		const mainDish = meal.mainName;
		const allergens = meal.childAllergens || '';
		const addOns = meal.addOns?.map((addOn: any) => addOn.display).join(', ') || '';

		// Initialize main dish entry if needed
		if (!mainDishSummary[mainDish]) {
			mainDishSummary[mainDish] = { count: 0, variations: [] };
		}

		// Increment main dish count
		mainDishSummary[mainDish].count++;

		// Find or create variation
		const existingVariation = mainDishSummary[mainDish].variations.find(
			(v) => v.allergens === allergens && v.addOns === addOns
		);
		if (existingVariation) {
			existingVariation.count++;
		} else {
			mainDishSummary[mainDish].variations.push({ 
				count: 1, 
				allergens: allergens,
				addOns: addOns
			});
		}
	});

	// Build table rows
	const tableRows: any[] = [];

	// Process each main dish
	Object.entries(mainDishSummary).forEach(([mainDish, summary]) => {
		// Main dish header row
		tableRows.push([
			{ content: mainDish, colSpan: 2, styles: { fontStyle: 'bold' } },
			{ content: `x${summary.count}`, styles: { fontStyle: 'bold', halign: 'center' } },
		]);

		// Variation rows
		summary.variations.forEach((variation) => {
			// Build variation description
			const variationLines: string[] = [];
			
			if (variation.addOns) {
				variationLines.push(`Add-ons: ${variation.addOns}`);
			}
			
			if (variation.allergens) {
				variationLines.push(`Allergens: ${variation.allergens}`);
			}
			
			// If no add-ons or allergens, show "Standard"
			const variationText = variationLines.length > 0 
				? variationLines.join('\n') 
				: 'Standard';

			tableRows.push([
				{ content: '', styles: { cellWidth: 3 } },
				{ 
					content: variationText, 
					styles: { 
						fontSize: 7,
						// Color allergens red if present
						...(variation.allergens ? { textColor: [200, 0, 0] } : {})
					} 
				},
				{ content: `x${variation.count}`, styles: { halign: 'center' } },
			]);
		});

		// Spacer row between main dishes
		tableRows.push([{ content: '', colSpan: 3 }]);
	});

	// Generate table
	if (tableRows.length > 0) {
		pdf.autoTable({
			startY: yOffset,
			head: [[{ content: 'Main Dish', colSpan: 2 }, { content: 'Count' }]],
			body: tableRows,
			headStyles: {
				fillColor: [5, 45, 42],
				halign: 'left',
				textColor: [255, 255, 255],
			},
			theme: 'grid',
			columnStyles: {
				0: { cellWidth: 3 },
				1: { cellWidth: maxWidth * 0.7 },
				2: { cellWidth: maxWidth * 0.3 },
			},
			margin: { left: xOffset, right: 10 },
			tableWidth: maxWidth,
			styles: {
				cellPadding: 1.5,
				fontSize: 7,
				overflow: 'linebreak',
			},
		});
	}

	return (pdf as any).lastAutoTable.finalY + 10;
};

	const handlePrintClassBreakdown = () => {
		const pdf = new jsPDF({
			orientation: 'landscape',
			unit: 'mm',
			format: 'a4',
		}) as jsPDFWithPlugin;

		let yOffset = 10;

		
		Object.entries(groupedMeals).forEach(([date, schools], dateIndex) => {
			
			if (dateIndex > 0) {
				pdf.addPage();
				yOffset = 10;
			}

			pdf.setFontSize(14);
			pdf.setFont('helvetica', 'bold');

			
			const pageWidth = pdf.internal.pageSize.width;
			const dateText = `Date: ${date}`;
			const textWidth = pdf.getTextWidth(dateText);
			const centerX = (pageWidth - textWidth) / 2;

			pdf.text(dateText, centerX, yOffset);
			yOffset += 15;

			
			const schoolEntries = Object.entries(schools).sort((a, b) => a[0].localeCompare(b[0]));

			
			schoolEntries.forEach(([schoolName, schoolMeals], schoolIndex) => {
				
				if (schoolIndex > 0) {
					pdf.addPage();
					yOffset = 10;
				}

				const schoolX = 10;
				const schoolWidth = pdf.internal.pageSize.width - 20; 

				
				yOffset = processSchoolTable(pdf, schoolName, schoolMeals, schoolX, yOffset, schoolWidth);
			});
		});

		pdf.save('class-breakdown.pdf');
		toast.success('Class Breakdown generated and downloaded.');
	};

	
	const processSchoolTable = (
		pdf: jsPDFWithPlugin,
		schoolName: string,
		schoolMeals: any[],
		xOffset: number,
		yOffset: number,
		maxWidth: number
	) => {
		
		pdf.setFontSize(11);
		pdf.setFont('helvetica', 'bold');
		pdf.text(`${schoolName}`, xOffset, yOffset);
		yOffset += 8;

		
		const classCounts: Record<string, number> = {};

		
		schoolMeals.forEach((meal) => {
			let className = meal.childClass ?? 'Staff Room';
			if (meal.childIsTeacher) className = 'Staff Room';

			
			const year = meal.childYear ? String(meal.childYear).trim() : '';

			
			if (year) {
				
				if (['pre-primary', 'pre primary', 'pp', 'pre primary', 'preprimary'].includes(year.toLowerCase())) {
					className = `PP-${className}`;
				}
				
				else if (
					['kindergarten', 'kinder', 'k', 'kindy'].includes(year.toLowerCase()) ||
					year.toLowerCase().includes('kind') ||
					year.toLowerCase().includes('kinder')
				) {
					className = `K-${className}`;
				}
				
			}

			classCounts[className] = (classCounts[className] || 0) + 1;
		});

		
		const classNames = Object.keys(classCounts).sort((a, b) => {
			
			if (a === 'Staff Room') return 1;
			if (b === 'Staff Room') return -1;

			
			const isKClassA = a.startsWith('K-');
			const isKClassB = b.startsWith('K-');

			
			const isPPClassA = a.startsWith('PP-');
			const isPPClassB = b.startsWith('PP-');

			
			if (isKClassA && !isKClassB) return -1; 
			if (!isKClassA && isKClassB) return 1; 

			if (isKClassA && isKClassB) {
				
				const numA = parseInt(a.substring(2));
				const numB = parseInt(b.substring(2));
				if (!isNaN(numA) && !isNaN(numB)) {
					return numA - numB;
				}
				return a.localeCompare(b);
			}

			if (isPPClassA && !isPPClassB && !isKClassB) return -1; 
			if (!isPPClassA && !isKClassA && isPPClassB) return 1; 

			if (isPPClassA && isPPClassB) {
				
				const numA = parseInt(a.substring(3));
				const numB = parseInt(b.substring(3));
				if (!isNaN(numA) && !isNaN(numB)) {
					return numA - numB;
				}
				return a.localeCompare(b);
			}

			
			
			const numA = parseInt(a);
			const numB = parseInt(b);

			if (!isNaN(numA) && !isNaN(numB)) {
				return numA - numB;
			}

			
			return a.localeCompare(b);
		});

		
		const tableData = classNames.map((className) => [className, classCounts[className].toString()]);

		
		tableData.push(['Total', schoolMeals.length.toString()]);

		
		pdf.autoTable({
			startY: yOffset,
			head: [['Class', 'Qty']],
			body: tableData,
			headStyles: {
				fillColor: [5, 45, 42],
				halign: 'center',
				valign: 'middle',
				textColor: [255, 255, 255],
			},
			bodyStyles: {
				halign: 'center',
			},
			columnStyles: {
				0: { fontStyle: 'normal', halign: 'left', cellWidth: maxWidth * 0.7 },
				1: { fontStyle: 'normal', halign: 'center', cellWidth: maxWidth * 0.3 },
			},
			didParseCell: function (data) {
				
				if (data.row.index === tableData.length - 1) {
					data.cell.styles.fillColor = [5, 45, 42];
					data.cell.styles.textColor = [255, 255, 255];
					data.cell.styles.fontStyle = 'bold';
				}
			},
			theme: 'grid',
			tableWidth: maxWidth,
			margin: { left: xOffset, right: 10 },
			styles: {
				cellPadding: 2,
				fontSize: 8,
				overflow: 'linebreak',
			},
		});

		return (pdf as any).lastAutoTable.finalY + 10;
	};

	const today = new Date();
	const tomorrow = addDays(today, 1);

	const renderMealCard = (meal: MealWithId) => (
		<Card
			key={meal.id}
			className="mb-4">
			<CardContent className="p-4">
				<div className="flex items-center justify-between mb-3">
					<Badge
						variant="outline"
						className="bg-blue-50 text-blue-700">
						{formatDate(meal.deliveryDate)}
					</Badge>
					<Badge variant="secondary">{meal.schoolName}</Badge>
				</div>
				<div className="grid grid-cols-2 gap-3 text-sm">
					<div>
						<span className="font-medium text-gray-700">Child:</span>
						<p className="text-gray-900">{meal.childName}</p>
					</div>
					<div>
						<span className="font-medium text-gray-700">Year:</span>
						<p className="text-gray-900">{meal.childIsTeacher ? 'Staff' : meal.childYear || 'N/A'}</p>
					</div>
					<div>
						<span className="font-medium text-gray-700">Class:</span>
						<p className="text-gray-900">{meal.childIsTeacher ? 'Staff' : meal.childClass || 'N/A'}</p>
					</div>
					<div>
						<span className="font-medium text-gray-700">Main Dish:</span>
						<p className="text-gray-900">{meal.mainName}</p>
					</div>
					<div className="col-span-2">
						<span className="font-medium text-gray-700">Add-ons:</span>
						<p className="text-gray-900">{formatAddOns(meal.addOns)}</p>
					</div>
					<div>
						<span className="font-medium text-gray-700">Side:</span>
						<p className="text-gray-900">{meal.sideName || 'N/A'}</p>
					</div>
					<div>
						<span className="font-medium text-gray-700">Fruit:</span>
						<p className="text-gray-900">{meal.fruitName || 'N/A'}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);

	
	if (error) {
		return (
			<div className="w-full space-y-6 p-4 sm:p-6">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Run Sheet</h1>
					<p className="text-gray-600 mt-1">Generate and manage meal distribution sheets</p>
				</div>

				<Card>
					<CardContent className="text-center py-12">
						<div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
							<AlertCircle className="h-8 w-8 text-red-400" />
						</div>
						<h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Run Sheet</h3>
						<p className="text-gray-500 mb-6">{error}</p>
						<Button onClick={() => window.location.reload()}>Retry</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="w-full space-y-6 p-4 sm:p-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Run Sheet</h1>
					<p className="text-gray-600 mt-1">Generate and manage meal distribution sheets</p>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="default"
							disabled={isLoading || meals.length === 0}>
							<PrinterIcon className="mr-2 h-4 w-4" />
							Print / Export
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem onClick={handlePrintRunSheet}>
							<FileText className="mr-2 h-4 w-4" />
							Print Run Sheet Summary
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => handlePrintLabels()}>
							<Tags className="mr-2 h-4 w-4" />
							Print Labels
						</DropdownMenuItem>
						<DropdownMenuItem onClick={handlePrintMissingLabels}>
							<Tags className="mr-2 h-4 w-4" />
							Print Missing Labels
						</DropdownMenuItem>
						<DropdownMenuItem onClick={handlePrintMainDishSummary}>
							<ChefHat className="mr-2 h-4 w-4" />
							Print Main Dish Summary
						</DropdownMenuItem>
						<DropdownMenuItem onClick={handlePrintClassBreakdown}>
							<Users className="mr-2 h-4 w-4" />
							Print Class Breakdown
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Filters Section */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Clock className="h-5 w-5" />
						Filters
					</CardTitle>
					<p className="text-sm text-gray-600 mt-1">Select date range and school to generate run sheet</p>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{/* Quick Select */}
						<div className="space-y-2">
							<label className="text-sm font-medium text-gray-700">Quick Select</label>
							<Select
								value={quickSelect}
								onValueChange={handleQuickSelect}
								disabled={isLoading}>
								<SelectTrigger className="bg-white">
									<SelectValue placeholder="Select period" />
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
						</div>

						{/* Custom Date Range */}
						<div className="space-y-2">
							<label className="text-sm font-medium text-gray-700">Custom Date Range</label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className={`w-full bg-white justify-start text-left font-normal ${
											quickSelect !== 'custom' || isLoading ? 'opacity-50 cursor-not-allowed' : ''
										}`}
										disabled={quickSelect !== 'custom' || isLoading}>
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
								<PopoverContent
									className="w-auto p-0"
									align="start">
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
						</div>

						{/* School Filter */}
						<div className="space-y-2">
							<label className="text-sm font-medium text-gray-700">School</label>
							<Select
								value={selectedSchool}
								onValueChange={handleSchoolSelect}
								disabled={isLoading}>
								<SelectTrigger className="bg-white">
									<SelectValue placeholder="Select school" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Schools</SelectItem>
									{[...state.schools]
										.sort((a, b) => {
											if (a.isActive !== b.isActive) {
												return a.isActive ? -1 : 1;
											}
											return a.name.localeCompare(b.name);
										})
										.map((school) => (
											<SelectItem
												key={school.id}
												value={school.name}
												className={!school.isActive ? 'text-gray-400' : ''}>
												{school.name}
												{!school.isActive && ' (Inactive)'}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Loading State */}
			{isLoading && (
				<Card>
					<CardContent className="text-center py-12">
						<Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-600 mx-auto" />
						<p className="text-lg text-gray-600">Loading run sheet data...</p>
					</CardContent>
				</Card>
			)}

			{/* No Data State */}
			{!isLoading && meals.length === 0 && (
				<Card>
					<CardContent className="text-center py-12">
						<div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
							<ChefHat className="h-8 w-8 text-gray-400" />
						</div>
						<h3 className="text-lg font-medium text-gray-900 mb-2">No Meals Found</h3>
						<p className="text-gray-500 mb-6">
							No meals are scheduled for the selected date range and school.
						</p>
						<Badge
							variant="outline"
							className="bg-blue-50 text-blue-700">
							Try selecting a different date range or school
						</Badge>
					</CardContent>
				</Card>
			)}

			{/* Data Display */}
			{!isLoading && meals.length > 0 && (
				<>
					{/* Summary Section */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h2 className="text-xl font-semibold text-gray-900">Run Sheet Results</h2>
							<div className="flex items-center gap-2">
								<Badge
									variant="outline"
									className="bg-green-50 text-green-700">
									{sortedMeals.length} meals
								</Badge>
								<Badge
									variant="outline"
									className="bg-blue-50 text-blue-700">
									{selectedSchool === 'all' ? 'All Schools' : selectedSchool}
								</Badge>
							</div>
						</div>

						<RunSheetSummary meals={sortedMeals} />
					</div>

					{/* Detailed Meal List */}
					<div className="space-y-4">
						<h3 className="text-xl font-semibold text-gray-900">Detailed Meal List</h3>

						{/* Mobile view */}
						<div className="md:hidden space-y-4">{sortedMeals.map(renderMealCard)}</div>

						{/* Desktop view */}
                        <div className="hidden md:block">
                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Child</TableHead>
                                                <TableHead className="text-center">Year</TableHead>
                                                <TableHead className="text-center">Class</TableHead>
                                                <TableHead>Main Dish</TableHead>
                                                <TableHead>Add-ons</TableHead>
                                                <TableHead>Side / Fruit</TableHead>
                                                <TableHead>Allergens</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {Object.entries(groupedMeals).map(([date, schools]) => (
                                                <React.Fragment key={date}>
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={7}
                                                            className="font-bold bg-gray-100 text-gray-900">
                                                            <div className="flex items-center gap-2">
                                                                <CalendarIcon className="h-4 w-4" />
                                                                {date}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                    {Object.entries(schools).map(([school, meals]) => (
                                                        <React.Fragment key={school}>
                                                            <TableRow>
                                                                <TableCell
                                                                    colSpan={7}
                                                                    className="font-semibold bg-gray-50 text-gray-900">
                                                                    <div className="flex items-center gap-2">
                                                                        <GraduationCap className="h-4 w-4" />
                                                                        {school}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                            {meals.map((meal) => (
                                                                <TableRow key={meal.id}>
                                                                    <TableCell className="font-medium">
                                                                        {meal.childName}
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        {meal.childIsTeacher
                                                                            ? 'Staff'
                                                                            : meal.childYear || 'N/A'}
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        {meal.childIsTeacher
                                                                            ? 'Staff'
                                                                            : meal.childClass || 'N/A'}
                                                                    </TableCell>
                                                                    <TableCell>{meal.mainName}</TableCell>
                                                                    <TableCell>{formatAddOns(meal.addOns)}</TableCell>
                                                                    <TableCell>
                                                                        {formatSideAndFruit(
                                                                            meal.sideName,
                                                                            meal.fruitName
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {meal.childAllergens && meal.childAllergens.trim() !== '' ? (
                                                                            <span className="text-red-600 font-medium">
                                                                                {meal.childAllergens}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-gray-400">None</span>
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </React.Fragment>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
					</div>
				</>
			)}

			{showMissingLabelsDialog && (
				<MissingLabelsDialog
					open={true}
					onClose={() => setShowMissingLabelsDialog(false)}
					onConfirm={handleMissingLabelsConfirm}
					isLoading={isMissingLabelsLoading}
				/>
			)}
		</div>
	);
};

export default RunSheet;
