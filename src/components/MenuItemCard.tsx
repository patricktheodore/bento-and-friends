import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wheat, Egg, Milk, Bean } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Main } from '@/models/item.model';
import { Meal } from '@/models/order.model';
import OrderDialog from './OrderDialog';

export interface MenuItemProps {
  image?: string;
  title: string;
  description: string;
  allergens?: string[];
  isVegetarian?: boolean;
  item: Main;
  onOrderNow: () => void;
}

const allergenIcons: { [key: string]: React.ReactNode } = {
  gluten: <Wheat size={18} />,
  eggs: <Egg size={18} />,
  dairy: <Milk size={18} />,
  soy: <Bean size={18} />,
};

const MenuItemCard: React.FC<MenuItemProps> = ({ title, description, allergens, item }) => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  const createAccount = () => {
    navigate('/signin');
  };

  const login = () => {
    navigate('/signin');
  };

  const handleOrderNow = () => {
    setIsOrderDialogOpen(true);
  };

  const handleAddToCart = (meals: Meal[]) => {
    meals.forEach((meal) => {
      dispatch({ type: 'ADD_TO_CART', payload: meal });
    });
    setIsOrderDialogOpen(false);
  };

  return (
    <>
      <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg flex flex-row md:flex-col h-full">
        <div className="relative w-32 md:w-full aspect-square shrink-0">
          <img
            src={item.image}
            alt={item.display}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {allergens && allergens.length > 0 && (
            <div className="absolute bottom-2 right-2 bg-white bg-opacity-50 rounded-full p-1 flex gap-1">
              <TooltipProvider>
                {allergens.map((allergen) => (
                  <Tooltip key={allergen}>
                    <TooltipTrigger>
                      <span className="text-brand-dark-green">
                        {allergenIcons[allergen.toLowerCase()] || allergen[0].toUpperCase()}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Contains {allergen}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          )}
        </div>
        <div className="flex flex-col flex-grow min-w-0">
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-brand-dark-green">
              <span className="truncate">{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow p-2 md:p-6">
            <p className="text-brand-taupe text-sm line-clamp-1 md:line-clamp-3">{description}</p>
          </CardContent>
          <CardFooter className="mt-auto p-3 md:p-6">
            {state.user ? (
              <Button
                className="w-full bg-brand-cream text-brand-dark-green hover:bg-brand-dark-green hover:text-brand-cream"
                onClick={handleOrderNow}
              >
                Order now
              </Button>
            ) : (
              <div className="w-full flex flex-col md:flex-row justify-center items-center gap-2">
                <Button
                  onClick={createAccount}
                  variant="outline"
                  className="w-full"
                >
                  Create an Account
                </Button>
                <Button
                  onClick={login}
                  variant="default"
                  className="w-full"
                >
                  Login to Order
                </Button>
              </div>
            )}
          </CardFooter>
        </div>
      </Card>
      <OrderDialog
        isOpen={isOrderDialogOpen}
        onClose={() => setIsOrderDialogOpen(false)}
        selectedMain={item}
        addOns={state.addOns}
        children={state.user?.children || []}
        schools={state.schools}
        onAddToCart={handleAddToCart}
      />
    </>
  );
};

export default MenuItemCard;