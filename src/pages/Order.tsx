// src/pages/OrderPage.tsx

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import MenuItemCard from '../components/MenuItemCard';
import OrderDialog from '../components/OrderDialog';
import { Main } from '@/models/item.model';
import { Meal } from '@/models/order.model';

const OrderPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMain, setSelectedMain] = useState<Main | null>(null);

    const handleOrderNow = (itemId: string) => {
        const main = state.mains.find(m => m.id === itemId);
        if (main) {
            setSelectedMain(main);
            setIsModalOpen(true);
        }
    };

    const handleAddToCart = (meals: Meal[]) => {
        meals.forEach(meal => {
            dispatch({ type: 'ADD_TO_CART', payload: meal });
        });
    };

    return (
        <div className="container mx-auto p-4 py-8">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">Order</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
                {state.mains.map((item) => (
                    <MenuItemCard
                        key={item.id}
                        image={item.image}
                        description={item.description}
                        title={item.display}
                        allergens={item.allergens}
                        isVegetarian={item.isVegetarian}
						item={item}
                    />
                ))}
            </div>
            <OrderDialog
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedMain={selectedMain}
                addOns={state.addOns}
                children={state.user?.children || []}
                schools={state.schools}
                onAddToCart={handleAddToCart}
            />
        </div>
    );
};

export default OrderPage;