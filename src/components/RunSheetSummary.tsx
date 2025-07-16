import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Utensils, Apple, Coffee, ChefHat } from 'lucide-react';
import { MealWithId } from '@/services/run-sheet-operations';

interface RunSheetSummaryProps {
	meals: MealWithId[];
}

interface Variation {
	count: number;
	description: string;
}

const RunSheetSummary: React.FC<RunSheetSummaryProps> = ({ meals }) => {
	const { mainDishSummary, sidesSummary, fruitSummary, totalMeals, totalSides, totalFruits } = useMemo(() => {
		// Main dish summary
		const mainDishes: { [key: string]: Variation[] } = {};

		// Sides and fruit summaries
		const sides: { [key: string]: number } = {};
		const fruits: { [key: string]: number } = {};

		meals.forEach((meal) => {
			// Process main dishes
			const mainDish = meal.mainName;
			const addOns = meal.addOns?.map((addOn) => addOn.display).join(', ') || '';

			// Create a variation description based on add-ons
			let variationDesc = '';
			if (addOns) {
				variationDesc = `Add-ons: ${addOns}`;
			} else {
				variationDesc = 'Standard';
			}

			// Add to main dish summary
			if (!mainDishes[mainDish]) {
				mainDishes[mainDish] = [];
			}

			// Find existing variation or create new one
			const existingVariation = mainDishes[mainDish].find((v) => v.description === variationDesc);
			if (existingVariation) {
				existingVariation.count++;
			} else {
				mainDishes[mainDish].push({ count: 1, description: variationDesc });
			}

			// Process sides
			if (meal.sideName) {
				const side = meal.sideName;
				sides[side] = (sides[side] || 0) + 1;
			}

			// Process fruit
			if (meal.fruitName) {
				const fruit = meal.fruitName;
				fruits[fruit] = (fruits[fruit] || 0) + 1;
			}
		});

		// Calculate totals for sides and fruits
		const totalSidesCount = Object.values(sides).reduce((sum, count) => sum + count, 0);
		const totalFruitsCount = Object.values(fruits).reduce((sum, count) => sum + count, 0);

		return {
			mainDishSummary: mainDishes,
			sidesSummary: sides,
			fruitSummary: fruits,
			totalMeals: meals.length,
			totalSides: totalSidesCount,
			totalFruits: totalFruitsCount,
		};
	}, [meals]);

	// Helper to get total count for a main dish
	const getTotalCount = (variations: Variation[]) => {
		return variations.reduce((sum, variation) => sum + variation.count, 0);
	};

	// Helper to sort object entries by count in descending order
	const sortByCount = (entries: [string, number][]) => {
		return entries.sort((a, b) => b[1] - a[1]);
	};

	if (meals.length === 0) {
		return (
			<Card>
				<CardContent className="text-center py-8">
					<div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
						<ChefHat className="h-6 w-6 text-gray-400" />
					</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">No Meals to Summarize</h3>
					<p className="text-gray-500">Select a date range to view meal summaries</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Summary Header */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-xl font-semibold text-gray-900">Meal Summary</h3>
					<p className="text-sm text-gray-600 mt-1">Breakdown of all meals for the selected period</p>
				</div>
				<Badge
					variant="outline"
					className="bg-blue-50 text-blue-700 border-blue-200">
					<Utensils className="h-3 w-3 mr-1" />
					{totalMeals} Total Meals
				</Badge>
			</div>

			{/* Main Dishes Summary Section */}
			<Card className="shadow-sm">
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2">
						<div className="p-2 bg-orange-100 rounded-lg">
							<Utensils className="h-4 w-4 text-orange-600" />
						</div>
						Main Dishes Summary
					</CardTitle>
					<p className="text-sm text-gray-600 mt-1">
						{Object.keys(mainDishSummary).length} different main dishes
					</p>
				</CardHeader>
				<CardContent>
					{Object.keys(mainDishSummary).length > 0 ? (
						<div className="space-y-4">
							{Object.entries(mainDishSummary).map(([mainDish, variations]) => {
								const totalCount = getTotalCount(variations);

								return (
									<div
										key={mainDish}
										className="border-l-4 border-orange-200 pl-4 py-2">
										<div className="flex justify-between items-center mb-2">
											<h4 className="font-semibold text-gray-900">{mainDish}</h4>
											<Badge
												variant="secondary"
												className="bg-orange-100 text-orange-800">
												{totalCount} meals
											</Badge>
										</div>

										<div className="space-y-1">
											{variations.map((variation, idx) => (
												<div
													key={idx}
													className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
													<span className="text-gray-700">{variation.description}</span>
													<span className="font-medium text-gray-900">{variation.count}</span>
												</div>
											))}
										</div>
									</div>
								);
							})}
						</div>
					) : (
						<div className="text-center py-4 text-gray-500">No main dishes found</div>
					)}
				</CardContent>
			</Card>

			{/* Sides and Fruits Summary Section */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Sides Summary */}
				<Card className="shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2">
							<div className="p-2 bg-purple-100 rounded-lg">
								<Coffee className="h-4 w-4 text-purple-600" />
							</div>
							Sides Summary
						</CardTitle>
						<p className="text-sm text-gray-600 mt-1">
							{Object.keys(sidesSummary).length} different sides • {totalSides} total sides
						</p>
					</CardHeader>
					<CardContent>
						{Object.keys(sidesSummary).length > 0 ? (
							<div className="space-y-2">
								{sortByCount(Object.entries(sidesSummary)).map(([side, count]) => (
									<div
										key={side}
										className="flex justify-between items-center p-2 bg-gray-50 rounded">
										<span className="text-gray-700">{side}</span>
										<Badge
											variant="outline"
											className="bg-purple-50 text-purple-700 border-purple-200">
											{count}
										</Badge>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-4 text-gray-500">No sides found</div>
						)}
					</CardContent>
				</Card>

				{/* Fruits Summary */}
				<Card className="shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2">
							<div className="p-2 bg-green-100 rounded-lg">
								<Apple className="h-4 w-4 text-green-600" />
							</div>
							Fruits Summary
						</CardTitle>
						<p className="text-sm text-gray-600 mt-1">
							{Object.keys(fruitSummary).length} different fruits • {totalFruits} total fruits
						</p>
					</CardHeader>
					<CardContent>
						{Object.keys(fruitSummary).length > 0 ? (
							<div className="space-y-2">
								{sortByCount(Object.entries(fruitSummary)).map(([fruit, count]) => (
									<div
										key={fruit}
										className="flex justify-between items-center p-2 bg-gray-50 rounded">
										<span className="text-gray-700">{fruit}</span>
										<Badge
											variant="outline"
											className="bg-green-50 text-green-700 border-green-200">
											{count}
										</Badge>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-4 text-gray-500">No fruits found</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Additional Stats Card */}
			<Card className="shadow-sm">
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2">
						<div className="p-2 bg-blue-100 rounded-lg">
							<ChefHat className="h-4 w-4 text-blue-600" />
						</div>
						Summary Statistics
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="text-center">
							<div className="text-2xl font-bold text-gray-900">{totalMeals}</div>
							<div className="text-sm text-gray-600">Total Meals</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-orange-600">
								{Object.keys(mainDishSummary).length}
							</div>
							<div className="text-sm text-gray-600">Main Dish Types</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-purple-600">{Object.keys(sidesSummary).length}</div>
							<div className="text-sm text-gray-600">Side Types</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-green-600">{Object.keys(fruitSummary).length}</div>
							<div className="text-sm text-gray-600">Fruit Types</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default RunSheetSummary;
