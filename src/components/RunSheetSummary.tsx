import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MealSummaryProps {
  meals: any[];
}

interface MealVariation {
  count: number;
  allergens: string[];
  addOns: string[];
}

const MealSummary: React.FC<MealSummaryProps> = ({ meals }) => {
  const summary = useMemo(() => {
    const mealGroups: { [key: string]: { [key: string]: MealVariation } } = {};

    meals.forEach((meal) => {
      const mainDish = meal.main.display;
      const allergens = meal.allergens || [];
      const addOns = meal.addOns?.map((addOn: any) => addOn.display) || [];

      const variationKey = JSON.stringify({ allergens, addOns });

      if (!mealGroups[mainDish]) {
        mealGroups[mainDish] = {};
      }

      if (!mealGroups[mainDish][variationKey]) {
        mealGroups[mainDish][variationKey] = { count: 0, allergens, addOns };
      }

      mealGroups[mainDish][variationKey].count++;
    });

    return mealGroups;
  }, [meals]);

  const renderVariation = (variation: MealVariation) => {
    const parts = [];
    if (variation.allergens.length > 0) {
      parts.push(<span key="allergens" className="text-red-600">Allergens: {variation.allergens}</span>);
    }
    if (variation.addOns.length > 0) {
      parts.push(<span key="addons">Add-ons: {variation.addOns.join(', ')}</span>);
    }
    return parts.length > 0 ? parts : <span className="text-gray-500">Standard</span>;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(summary).map(([mainDish, variations]) => (
        <Card key={mainDish} className="overflow-hidden">
          <CardHeader className="bg-brand-dark-green text-white">
            <CardTitle className="flex justify-between items-center">
              <span>{mainDish}</span>
              <span className="text-3xl font-extrabold">
                {Object.values(variations).reduce((sum, v) => sum + v.count, 0)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ul className="space-y-2">
              {Object.entries(variations).map(([key, variation]) => (
                <li key={key} className="flex justify-between items-start border-b pb-2 last:border-b-0">
                  <div className="flex-grow">
                    {renderVariation(variation)}
                  </div>
                  <span className="font-bold ml-2">{variation.count}x</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MealSummary;