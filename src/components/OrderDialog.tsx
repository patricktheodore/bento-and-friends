// src/components/OrderDialog.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { Main, AddOn } from '@/models/item.model';
import { Child } from '@/models/user.model';
import { School } from '@/models/school.model';
import { Meal } from '@/models/order.model';
import { v4 as uuidv4 } from 'uuid';
import { useAppContext } from '@/context/AppContext';

interface OrderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    selectedMain: Main | null;
    addOns: AddOn[];
    children: Child[];
    schools: School[];
    onAddToCart: (meals: Meal[]) => void;
    initialSelectedAddons?: string[];
    initialSelectedChild?: string;
}

const OrderDialog: React.FC<OrderDialogProps> = ({
    isOpen,
    onClose,
    selectedMain,
    addOns,
    children,
    schools,
    onAddToCart,
    initialSelectedAddons,
    initialSelectedChild,
}) => {
    const {state } = useAppContext();
    const [selectedAddons, setSelectedAddons] = useState<string[]>(initialSelectedAddons || []);
    const [selectedChildren, setSelectedChildren] = useState<string[]>(initialSelectedChild ? [initialSelectedChild] : []);
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);

    useEffect(() => {
        if (isOpen) {
            setSelectedAddons(initialSelectedAddons || []);
            setSelectedChildren(initialSelectedChild ? [initialSelectedChild] : []);
            setSelectedDates([]);
        }
    }, [isOpen, initialSelectedAddons, initialSelectedChild]);

    const glutenFreeAddon = useMemo(() => 
        addOns.find(addon => addon.display.toLowerCase().includes('gluten free')),
        [addOns]
    );

    const handleAddToCart = () => {
        if (!selectedMain) return;

        let meals: Meal[] = [];

        selectedChildren.forEach(childId => {
            const selectedChildData = children.find((child) => child.id === childId);
            if (selectedChildData) {
                const hasGlutenAllergy = selectedChildData.allergens?.toLowerCase().includes('gluten') ||
                                         selectedChildData.allergens?.toLowerCase().includes('celiac');
                
                let mealAddons = addOns.filter((addon) => selectedAddons.includes(addon.id));
                let mealTotal = selectedMain.price + mealAddons.reduce((sum, addon) => sum + addon.price, 0);

                if (hasGlutenAllergy && glutenFreeAddon && !selectedAddons.includes(glutenFreeAddon.id)) {
                    mealAddons.push(glutenFreeAddon);
                    mealTotal += glutenFreeAddon.price;
                }

                selectedDates.forEach(date => {
                    meals.push({
                        id: uuidv4(),
                        main: selectedMain,
                        addOns: mealAddons,
                        probiotic: undefined,
                        fruit: undefined,
                        drink: undefined,
                        school: schools.find((school) => school.name === selectedChildData.school) as School,
                        orderDate: date.toISOString(),
                        child: selectedChildData,
                        total: mealTotal,
                    });
                });
            }
        });

        onAddToCart(meals);
        toast.success(`Added ${meals.length} meal${meals.length !== 1 ? 's' : ''} to cart!`, { duration: 5000 });
        handleClose();
    };

    const handleClose = () => {
        setSelectedAddons([]);
        setSelectedChildren([]);
        setSelectedDates([]);
        onClose();
    };

    const renderSummary = () => {
        return (
            <div className="bg-gray-100 p-4 rounded-md mb-4 space-y-2">
                <h3 className="font-semibold">Order Summary</h3>
                <p className='text-sm'>Main: {selectedMain?.display}</p>
                {selectedAddons.length > 0 && (
                    <p className='text-sm'>Add-ons: {addOns.filter(addon => selectedAddons.includes(addon.id)).map(addon => addon.display).join(', ')}</p>
                )}
                <p className="text-sm text-gray-600 italic">
                    Note: Gluten-free option will be automatically added (and charged) when adding to cart for children with gluten/celiac allergies.
                </p>
            </div>
        );
    };

    const isValidDate = (date: Date) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		const day = date.getDay();
		const isWeekend = day === 0 || day === 6;
		const isPast = date <= today;
		const isBlocked = state.blockedDates.some(
			blockedDate => new Date(blockedDate).toDateString() === date.toDateString()
		);

		return isWeekend || isPast || isBlocked;
	};

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="w-full sm:max-w-[425px] md:max-w-[600px] h-[90vh] sm:h-auto">
                <DialogHeader>
                    <DialogTitle>Customise Your Meal/s</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[calc(90vh-180px)] sm:max-h-[calc(100vh-240px)] pr-4">
                    {renderSummary()}
                    <div className="space-y-6">                        
                        <div>
                            <h4 className="font-semibold mb-2">1. Add-ons</h4>
                            <div className="space-y-2">
                                {addOns.map((addon) => (
                                    <div key={addon.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={addon.id}
                                            checked={selectedAddons.includes(addon.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedAddons(prev => [...prev, addon.id]);
                                                } else {
                                                    setSelectedAddons(prev => prev.filter(id => id !== addon.id));
                                                }
                                            }}
                                        />
                                        <Label htmlFor={addon.id} className="text-sm">
                                            {addon.display} (${addon.price.toFixed(2)})
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold mb-2">2. Select Recipients</h4>
                            <div className="space-y-2">
                                {children.map((child) => (
                                    <div key={child.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`child-${child.id}`}
                                            checked={selectedChildren.includes(child.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedChildren(prev => [...prev, child.id]);
                                                } else {
                                                    setSelectedChildren(prev => prev.filter(id => id !== child.id));
                                                }
                                            }}
                                        />
                                        <Label htmlFor={`child-${child.id}`} className="text-sm">
                                            {child.name}
                                            {child.allergens && (
                                                <span className="text-xs text-gray-500 ml-2">({child.allergens})</span>
                                            )}
                                            {(child.allergens?.toLowerCase().includes('gluten') || 
                                              child.allergens?.toLowerCase().includes('celiac')) && (
                                                <Badge variant="outline" className="ml-2">Gluten-free meal</Badge>
                                            )}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold mb-2">3. Select Dates</h4>
                            <Calendar
                                mode="multiple"
                                selected={selectedDates}
                                onSelect={(dates) => setSelectedDates(dates || [])}
                                className="rounded-md border"
                                disabled={isValidDate}
                            />
                        </div>
                    </div>
                </ScrollArea>
                
                <div className="mt-6">
                    <Button 
                        onClick={handleAddToCart} 
                        disabled={selectedChildren.length === 0 || selectedDates.length === 0}
                        className="w-full"
                    >
                        Add to Cart
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default OrderDialog;