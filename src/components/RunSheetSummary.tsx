import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RunSheetSummaryProps {
  meals: any[];
}

interface Variation {
  count: number;
  description: string;
}

const RunSheetSummary: React.FC<RunSheetSummaryProps> = ({ meals }) => {
  const { mainDishSummary, yogurtSummary, fruitSummary } = useMemo(() => {
    // Main dish summary
    const mainDishes: { [key: string]: Variation[] } = {};
    
    // Yogurt and fruit summaries
    const yogurts: { [key: string]: number } = {};
    const fruits: { [key: string]: number } = {};
    
    meals.forEach((meal) => {
      // Process main dishes
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
      
      // Add to main dish summary
      if (!mainDishes[mainDish]) {
        mainDishes[mainDish] = [];
      }
      
      // Find existing variation or create new one
      const existingVariation = mainDishes[mainDish].find(v => v.description === variationDesc);
      if (existingVariation) {
        existingVariation.count++;
      } else {
        mainDishes[mainDish].push({ count: 1, description: variationDesc });
      }
      
      // Process yogurt
      if (meal.probiotic?.display) {
        const yogurt = meal.probiotic.display;
        yogurts[yogurt] = (yogurts[yogurt] || 0) + 1;
      }
      
      // Process fruit
      if (meal.fruit?.display) {
        const fruit = meal.fruit.display;
        fruits[fruit] = (fruits[fruit] || 0) + 1;
      }
    });
    
    return { 
      mainDishSummary: mainDishes, 
      yogurtSummary: yogurts, 
      fruitSummary: fruits 
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

  return (
    <div className="space-y-6">
      {/* Main Dishes Summary Section */}
      <Card>
        <CardHeader className="bg-brand-dark-green text-white rounded-t">
          <CardTitle>Main Dishes Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <ul className="divide-y">
            {Object.entries(mainDishSummary).map(([mainDish, variations]) => {
              const totalCount = getTotalCount(variations);
              
              return (
                <li key={mainDish} className="py-2">
                  <div className="flex justify-between font-bold">
                    <span>{mainDish}</span>
                    <span>x{totalCount}</span>
                  </div>
                  
                  <ul className="ml-6 text-sm text-gray-600 mt-1">
                    {variations.map((variation, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span>{variation.description}</span>
                        <span className="font-medium">x{variation.count}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
      
      {/* Probiotics (Yogurt) Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="bg-brand-dark-green text-white rounded-t">
            <CardTitle>Sides Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ul className="divide-y">
              {sortByCount(Object.entries(yogurtSummary)).map(([yogurt, count]) => (
                <li key={yogurt} className="py-2 flex justify-between">
                  <span>{yogurt}</span>
                  <span className="font-bold">x{count}</span>
                </li>
              ))}
              {Object.keys(yogurtSummary).length === 0 && (
                <li className="py-2 text-gray-500">No sides found</li>
              )}
            </ul>
          </CardContent>
        </Card>
        
        {/* Fruits Summary Section */}
        <Card>
          <CardHeader className="bg-brand-dark-green text-white rounded-t">
            <CardTitle>Fruits Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ul className="divide-y">
              {sortByCount(Object.entries(fruitSummary)).map(([fruit, count]) => (
                <li key={fruit} className="py-2 flex justify-between">
                  <span>{fruit}</span>
                  <span className="font-bold">x{count}</span>
                </li>
              ))}
              {Object.keys(fruitSummary).length === 0 && (
                <li className="py-2 text-gray-500">No fruits found</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RunSheetSummary;