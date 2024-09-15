import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Button } from '@/components/ui/button';

const CartIcon: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const itemCount = state.cart?.meals.length || 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => dispatch({ type: 'TOGGLE_CART' })}
      className="relative hover:text-brand-gold"
      aria-label="Open cart"
    >
      <ShoppingCart className="h-8 w-8 md:h-6 md:w-6" />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-brand-gold text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </Button>
  );
};

export default CartIcon;