import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DiscountMessageProps {
  mealCount: number;
  currentDiscount: number;
}

const DiscountMessage: React.FC<DiscountMessageProps> = ({ mealCount, currentDiscount }) => {
  const getDiscountMessage = () => {
    if (mealCount >= 5) {
      return "You've earned 20% off this order!";
    } else if (mealCount === 4) {
      return "Order one more to save 20%!";
    } else if (mealCount === 3) {
      return "Order two more to save 20%!";
    } else if (mealCount === 2) {
      return "Order one more to save 10%!";
    } else if (mealCount === 1) {
      return "Order one more to save 5%!";
    } else {
      return "Bundle meals to unlock discounts!";
    }
  };

  return (
    <Alert variant="default" className="bg-lime-100 flex justify-start items-center mt-4">
      <div className='h-full w-fit flex justify-center items-center mr-4'>
        <AlertCircle className="h-4 w-4" />
      </div>
      <AlertDescription>
        {currentDiscount > 0 && (
          <p className="font-semibold"> Current discount: {currentDiscount}%</p>
        )}
        {getDiscountMessage()}
      </AlertDescription>
    </Alert>
  );
};

export default DiscountMessage;