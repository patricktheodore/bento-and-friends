import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MealSummaryProps {
	meals: any[];
}

interface MealVariation {
	count: number;
	allergens: string[];
	addOns: string[];
	hasAllergens: boolean;
}

type VariationEntry = [string, MealVariation];
type MainDishEntry = [string, VariationEntry[], number];

const MealSummary: React.FC<MealSummaryProps> = ({ meals }) => {
	const summary = useMemo(() => {
		const mealGroups: { [key: string]: { [key: string]: MealVariation } } = {};

		meals.forEach((meal) => {
			const mainDish = meal.main.display;
			const allergens: string[] = meal.allergens || [];
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

		return mealGroups;
	}, [meals]);

	const sortedSummary: MainDishEntry[] = useMemo(() => {
		return Object.entries(summary).map(([mainDish, variations]): MainDishEntry => {
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
	}, [summary]);

	const formatVariation = (variation: MealVariation): string => {
		const parts: string[] = [];
		if (variation.allergens.length > 0) {
			parts.push(`Allergens: ${variation.allergens}`);
		}
		if (variation.addOns.length > 0) {
			parts.push(`Add-ons: ${variation.addOns.join(', ')}`);
		}
		return parts.join(' | ') || 'No changes';
	};

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4 mb-6">
			{sortedSummary.map(([mainDish, variations, totalCount]) => (
				<Card key={mainDish}>
					<CardHeader className="pb-2">
						<CardTitle className="flex justify-between items-center">
							<span>{mainDish}</span>
							<span className="text-3xl font-extrabold">{totalCount}</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4">
						<ul className="space-y-2">
							{variations.map(([variationKey, variation], index, array) => (
								<React.Fragment key={variationKey}>
									{index > 0 && variation.hasAllergens && !array[index - 1][1].hasAllergens && (
										<li className="border-t border-brand-taupe my-2"></li>
									)}
									<li className="flex justify-start items-start gap-2">
										<span className="font-bold">{variation.count}x</span>
										<span className="text-left">{formatVariation(variation)}</span>
									</li>
								</React.Fragment>
							))}
						</ul>
					</CardContent>
				</Card>
			))}
		</div>
	);
};

export default MealSummary;
