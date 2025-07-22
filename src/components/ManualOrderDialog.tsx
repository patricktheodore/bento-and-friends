import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Calendar } from './ui/calendar';
import { Plus, Trash2, ShoppingCart, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { User as UserType, Child } from '@/models/user.model';
import { useAppContext } from '@/context/AppContext';
import { formatDate } from '@/utils/utils';
import { isValidDateCheck } from '@/utils/dateValidation';
import toast from 'react-hot-toast';

interface ManualOrderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    preselectedUser?: UserType | null;
    onOrderCreated: (order: any) => void;
    isCreatingOrder?: boolean; // New prop for external loading state
}

interface OrderItem {
    id: string;
    child: Child;
    main: any;
    addOns: any[];
    side?: any;
    fruit?: any;
    deliveryDate: string;
    total: number;
}

const ManualOrderDialog: React.FC<ManualOrderDialogProps> = ({
    isOpen,
    onClose,
    preselectedUser,
    onOrderCreated,
    isCreatingOrder = false
}) => {
    const { state } = useAppContext();
    const { mains, sides, fruits, schools, addOns: availableAddOns } = state;
    
    const [selectedUser, setSelectedUser] = useState<UserType | null>(preselectedUser || null);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [isAddingItem, setIsAddingItem] = useState(false);
    
    // Form state for new item
    const [currentMain, setCurrentMain] = useState<any | null>(null);
    const [selectedChild, setSelectedChild] = useState<string>('');
    const [selectedAddOns, setSelectedAddOns] = useState<any[]>([]);
    const [selectedSide, setSelectedSide] = useState<any | undefined>();
    const [selectedFruit, setSelectedFruit] = useState<any | undefined>();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [isMainOnly, setIsMainOnly] = useState<boolean>(false);

    // Check if any operation is in progress
    const isLoading = isCreatingOrder || isAddingItem;

    // Get available mains for the selected child's school
    const availableMains = useMemo(() => {
        if (!selectedChild || !selectedUser) return [];
        
        const child = selectedUser.children.find(c => c.id === selectedChild);
        if (!child) return [];
        
        const school = schools.find(s => s.id === child.schoolId);
        if (!school?.menuItems) return [];
        
        return mains.filter(main => 
            main.isActive && school.menuItems?.includes(main.id)
        );
    }, [selectedChild, selectedUser, schools, mains]);

    // Get available add-ons for current main
    const availableMainAddOns = useMemo(() => {
        if (!currentMain?.addOns) return [];
        return availableAddOns.filter(addon => 
            addon.isActive && currentMain.addOns?.includes(addon.id)
        );
    }, [currentMain, availableAddOns]);

    // Get school for selected child
    const selectedSchool = useMemo(() => {
        if (!selectedChild || !selectedUser) return null;
        const child = selectedUser.children.find(c => c.id === selectedChild);
        return child ? schools.find(s => s.id === child.schoolId) : null;
    }, [selectedChild, selectedUser, schools]);

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (!isOpen) {
            setOrderItems([]);
            resetForm();
            if (!preselectedUser) {
                setSelectedUser(null);
            }
        }
    }, [isOpen, preselectedUser]);

    // Set preselected user when prop changes
    useEffect(() => {
        setSelectedUser(preselectedUser || null);
    }, [preselectedUser]);

    const resetForm = () => {
        setCurrentMain(null);
        setSelectedChild('');
        setSelectedAddOns([]);
        setSelectedSide(undefined);
        setSelectedFruit(undefined);
        setSelectedDate(undefined);
        setIsMainOnly(false);
        setIsAddingItem(false);
    };

    const isInvalidDate = (date: Date): boolean => {
        if (!selectedSchool) return true;
        
        let validDates = [];
        
        if (currentMain?.isPromo && currentMain?.validDates) {
            validDates = currentMain.validDates;
        } else if (selectedSchool?.validDates) {
            validDates = selectedSchool.validDates;
        } else {
            return false; // No valid dates to check against
        }

        return !(isValidDateCheck(date, validDates));
    };

    const handleMainChange = (mainId: string) => {
        if (isLoading) return;
        
        const main = availableMains.find(m => m.id === mainId);
        if (main) {
            setCurrentMain(main);
            setSelectedAddOns([]);
            setIsMainOnly(false);
            // Reset date when changing main (especially for promo items)
            setSelectedDate(undefined);
            
            // Set default side and fruit if available and not main only
            const activeSides = sides.filter(side => side.isActive);
            const activeFruits = fruits.filter(fruit => fruit.isActive);
            setSelectedSide(activeSides.length > 0 ? activeSides[0] : undefined);
            setSelectedFruit(activeFruits.length > 0 ? activeFruits[0] : undefined);
        }
    };

    const handleAddOnToggle = (addonId: string) => {
        if (isLoading) return;
        
        const addon = availableMainAddOns.find(a => a.id === addonId);
        if (!addon) return;

        const isSelected = selectedAddOns.some(a => a.id === addonId);
        const isMainOnlyAddon = addon.display.toLowerCase().includes('main only');

        if (isSelected) {
            setSelectedAddOns(selectedAddOns.filter(a => a.id !== addonId));
            if (isMainOnlyAddon) {
                setIsMainOnly(false);
                // Re-set default selections when switching back from main only
                const activeSides = sides.filter(side => side.isActive);
                const activeFruits = fruits.filter(fruit => fruit.isActive);
                setSelectedSide(activeSides.length > 0 ? activeSides[0] : undefined);
                setSelectedFruit(activeFruits.length > 0 ? activeFruits[0] : undefined);
            }
        } else {
            setSelectedAddOns([...selectedAddOns, addon]);
            if (isMainOnlyAddon) {
                setIsMainOnly(true);
                setSelectedSide(undefined);
                setSelectedFruit(undefined);
            }
        }
    };

    const calculateItemTotal = (main: any, addOns: any[]) => {
        let total = main?.price || 0;
        addOns.forEach(addOn => {
            total += addOn.price || 0;
        });
        return total;
    };

    const addOrderItem = async () => {
        if (isLoading) return;
        
        if (!selectedUser || !selectedChild || !currentMain || !selectedDate) {
            toast.error('Please fill in all required fields');
            return;
        }

        const child = selectedUser.children.find(c => c.id === selectedChild);
        if (!child) {
            toast.error('Invalid child selection');
            return;
        }

        // Validate sides and fruits if not main only
        if (!isMainOnly) {
            const activeSides = sides.filter(side => side.isActive);
            const activeFruits = fruits.filter(fruit => fruit.isActive);
            
            if (activeSides.length > 0 && !selectedSide) {
                toast.error('Please select a side');
                return;
            }
            if (activeFruits.length > 0 && !selectedFruit) {
                toast.error('Please select a fruit');
                return;
            }
        }

        setIsAddingItem(true);
        
        // Simulate a small delay for better UX feedback
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const total = calculateItemTotal(currentMain, selectedAddOns);

            const orderItem: OrderItem = {
                id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                child,
                main: currentMain,
                addOns: selectedAddOns,
                side: isMainOnly ? '' : selectedSide,
                fruit: isMainOnly ? '' : selectedFruit,
                deliveryDate: selectedDate.toISOString(),
                total
            };

            setOrderItems([...orderItems, orderItem]);
            resetForm();
            toast.success('Item added to order');
        } catch (error) {
            toast.error('Failed to add item to order');
        } finally {
            setIsAddingItem(false);
        }
    };

    const removeOrderItem = (itemId: string) => {
        if (isLoading) return;
        setOrderItems(orderItems.filter(item => item.id !== itemId));
        toast.success('Item removed from order');
    };

    const getTotalOrderValue = () => {
        return orderItems.reduce((sum, item) => sum + item.total, 0);
    };

    const handleCreateOrder = async () => {
        if (!selectedUser || orderItems.length === 0 || isCreatingOrder) {
            toast.error('Please add at least one item to the order');
            return;
        }

        try {
            // Convert order items to the format expected by the manual order function
            // This matches the exact structure that the webhook expects
            const cartData = {
                meals: orderItems.map((item) => {
                    const school = schools.find(s => s.id === item.child.schoolId);
                    
                    return {
                        id: item.id,
                        main: {
                            id: item.main.id,
                            display: item.main.display,
                            price: item.main.price
                        },
                        addOns: item.addOns.map(addOn => ({
                            id: addOn.id,
                            display: addOn.display,
                            price: addOn.price || 0
                        })),
                        side: item.side ? {
                            id: item.side.id,
                            display: item.side.display
                        } : null,
                        fruit: item.fruit ? {
                            id: item.fruit.id,
                            display: item.fruit.display
                        } : null,
                        child: {
                            id: item.child.id,
                            name: item.child.name,
                            allergens: item.child.allergens || '',
                            isTeacher: item.child.isTeacher || false,
                            year: item.child.year || '',
                            class: item.child.className || ''
                        },
                        school: {
                            id: item.child.schoolId,
                            name: school?.name || 'Unknown School',
                            address: school?.address || 'Address not available'
                        },
                        deliveryDate: item.deliveryDate,
                        total: item.total
                    };
                }),
                total: getTotalOrderValue()
            };

            onOrderCreated(cartData);
        } catch (error) {
            console.error('Error creating manual order:', error);
            toast.error('Failed to create manual order');
        }
    };

    const handleDialogClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogClose}>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
                {/* Loading Overlay */}
                {isCreatingOrder && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
                        <div className="text-center space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Processing Order...</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Creating order for {selectedUser?.displayName}
                                </p>
                                <div className="mt-3 px-4 py-2 bg-blue-50 rounded-lg inline-block">
                                    <p className="text-xs text-blue-700 font-medium">
                                        Please do not close this dialog
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Create Manual Order
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 ml-2">
                            Admin Mode
                        </Badge>
                        {isAddingItem && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 ml-1">
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                Adding Item...
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Create a manual order for a customer. Add multiple meal items and process the order directly.
                    </DialogDescription>
                </DialogHeader>

                {selectedUser && (
                    <>
                        {/* User Info */}
                        <div className="mx-1 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                                <div>
                                    <span className="text-sm font-semibold text-blue-900 block">
                                        Creating order for
                                    </span>
                                    <span className="text-base font-bold text-blue-800">
                                        {selectedUser.displayName} ({selectedUser.email})
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column - Food Selection */}
                            <div className="space-y-6">
                                {/* Child Selection */}
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <h3 className="text-lg font-semibold text-gray-900">Select Recipient</h3>
                                    <Select 
                                        value={selectedChild} 
                                        onValueChange={setSelectedChild}
                                        disabled={isLoading}
                                    >
                                        <SelectTrigger className={isLoading ? "opacity-50" : ""}>
                                            <SelectValue placeholder="Select child/recipient" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedUser.children.map(child => (
                                                <SelectItem key={child.id} value={child.id}>
                                                    {child.name} ({schools.find(s => s.id === child.schoolId)?.name})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {selectedSchool && (
                                        <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                                            <strong>School:</strong> {selectedSchool.name}
                                        </div>
                                    )}
                                </div>

                                {/* Main Dish Section */}
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <h3 className="text-lg font-semibold text-gray-900">Main Dish</h3>
                                    <Select
                                        value={currentMain?.id || ''}
                                        onValueChange={handleMainChange}
                                        disabled={!selectedChild || isLoading}
                                    >
                                        <SelectTrigger className={`bg-white ${isLoading ? "opacity-50" : ""}`}>
                                            <SelectValue placeholder={selectedChild ? "Select main dish" : "Select child first"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableMains.map(main => (
                                                <SelectItem key={main.id} value={main.id}>
                                                    <div className="flex items-center justify-between w-full">
                                                        <div className="flex items-center gap-2">
                                                            {main.isPromo && (
                                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                                                                    Promo
                                                                </Badge>
                                                            )}
                                                            <span>{main.display}</span>
                                                        </div>
                                                        <span className="font-medium ml-2">${main.price.toFixed(2)}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Add-ons Section */}
                                {availableMainAddOns.length > 0 && (
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <h3 className="text-lg font-semibold text-gray-900">Add-ons</h3>
                                        <div className="space-y-3">
                                            {availableMainAddOns.map(addon => (
                                                <div key={addon.id} className={`flex items-center space-x-3 p-2 hover:bg-white rounded cursor-pointer ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}>
                                                    <Checkbox
                                                        id={addon.id}
                                                        checked={selectedAddOns.some(a => a.id === addon.id)}
                                                        onCheckedChange={() => handleAddOnToggle(addon.id)}
                                                        disabled={isLoading}
                                                    />
                                                    <Label htmlFor={addon.id} className="flex-1 cursor-pointer">
                                                        <span className="flex justify-between items-center">
                                                            <span>{addon.display}</span>
                                                            <span className="font-medium text-sm">
                                                                {addon.price >= 0 ? `+$${addon.price.toFixed(2)}` : `-$${Math.abs(addon.price).toFixed(2)}`}
                                                            </span>
                                                        </span>
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Sides and Fruits */}
                                {!isMainOnly && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {sides.length > 0 && (
                                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                <h3 className="text-lg font-semibold text-gray-900">Side</h3>
                                                <RadioGroup 
                                                    value={selectedSide?.id || ''} 
                                                    onValueChange={(value) => {
                                                        if (!isLoading) {
                                                            const side = sides.find(s => s.id === value);
                                                            setSelectedSide(side);
                                                        }
                                                    }}
                                                    className="space-y-2"
                                                    disabled={isLoading}
                                                >
                                                    {sides.filter(side => side.isActive).map(side => (
                                                        <div key={side.id} className={`flex items-center space-x-2 p-1 ${isLoading ? "opacity-50" : ""}`}>
                                                            <RadioGroupItem 
                                                                value={side.id} 
                                                                id={`side-${side.id}`} 
                                                                disabled={isLoading}
                                                            />
                                                            <Label htmlFor={`side-${side.id}`} className="text-sm cursor-pointer">
                                                                {side.display}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            </div>
                                        )}

                                        {fruits.length > 0 && (
                                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                <h3 className="text-lg font-semibold text-gray-900">Fruit</h3>
                                                <RadioGroup 
                                                    value={selectedFruit?.id || ''} 
                                                    onValueChange={(value) => {
                                                        if (!isLoading) {
                                                            const fruit = fruits.find(f => f.id === value);
                                                            setSelectedFruit(fruit);
                                                        }
                                                    }}
                                                    className="space-y-2"
                                                    disabled={isLoading}
                                                >
                                                    {fruits.filter(fruit => fruit.isActive).map(fruit => (
                                                        <div key={fruit.id} className={`flex items-center space-x-2 p-1 ${isLoading ? "opacity-50" : ""}`}>
                                                            <RadioGroupItem 
                                                                value={fruit.id} 
                                                                id={`fruit-${fruit.id}`}
                                                                disabled={isLoading}
                                                            />
                                                            <Label htmlFor={`fruit-${fruit.id}`} className="text-sm cursor-pointer">
                                                                {fruit.display}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Right Column - Date and Order Management */}
                            <div className="space-y-6">
                                {/* Date Selection */}
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-900">Delivery Date</h3>
                                        {currentMain?.isPromo && (
                                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                                                Promo Dates
                                            </Badge>
                                        )}
                                    </div>
                                    
                                    <div className={`flex justify-center ${isLoading ? "opacity-50 pointer-events-none" : ""}`}>
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={setSelectedDate}
                                            disabled={!currentMain || isInvalidDate || isLoading}
                                            className="rounded-md border bg-white"
                                        />
                                    </div>
                                    {selectedDate && (
                                        <div className="mt-3 p-3 bg-white rounded border">
                                            <p className="text-sm font-medium text-gray-700 mb-1">Selected Date:</p>
                                            <p className="text-sm text-gray-600">
                                                {formatDate(selectedDate.toISOString())}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Item Total and Add Button */}
                                {currentMain && (
                                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-lg font-semibold text-gray-900">Item Total:</span>
                                            <span className="text-xl font-bold text-green-600">
                                                ${calculateItemTotal(currentMain, selectedAddOns).toFixed(2)}
                                            </span>
                                        </div>
                                        <Button 
                                            onClick={addOrderItem} 
                                            className="w-full"
                                            disabled={!selectedChild || !currentMain || !selectedDate || isLoading}
                                        >
                                            {isAddingItem ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Adding Item...
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Add Item to Order
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Items List */}
                        {orderItems.length > 0 && (
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <CalendarIcon className="h-5 w-5" />
                                        Order Items ({orderItems.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3 max-h-60 overflow-y-auto">
                                        {orderItems.map(item => (
                                            <div key={item.id} className={`border rounded-lg p-4 bg-gray-50 ${isLoading ? "opacity-50" : ""}`}>
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-medium">{item.main.display}</h4>
                                                            {item.main.isPromo && (
                                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                                                                    Promo
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600">For: {item.child.name}</p>
                                                        <p className="text-sm text-gray-600">
                                                            School: {schools.find(s => s.id === item.child.schoolId)?.name}
                                                        </p>
                                                        <p className="text-sm text-gray-600 flex items-center gap-1">
                                                            <CalendarIcon className="h-3 w-3" />
                                                            {formatDate(item.deliveryDate)}
                                                        </p>
                                                        {item.addOns.length > 0 && (
                                                            <p className="text-sm text-gray-600">
                                                                Add-ons: {item.addOns.map(ao => ao.display).join(', ')}
                                                            </p>
                                                        )}
                                                        {(item.side || item.fruit) && (
                                                            <p className="text-sm text-gray-600">
                                                                {item.side ? `Side: ${item.side.display}` : ''}
                                                                {item.side && item.fruit ? ', ' : ''}
                                                                {item.fruit ? `Fruit: ${item.fruit.display}` : ''}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-green-600">${item.total.toFixed(2)}</span>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => removeOrderItem(item.id)}
                                                            disabled={isLoading}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Order Total */}
                                    <div className="border-t pt-4 mt-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                                        <div className="flex justify-between items-center text-xl font-bold">
                                            <span className="text-gray-900">Order Total:</span>
                                            <span className="text-green-600">${getTotalOrderValue().toFixed(2)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}

                <DialogFooter className="mt-6 gap-3">
                    <Button 
                        variant="outline" 
                        onClick={handleDialogClose} 
                        className="px-6"
                        disabled={isLoading}
                    >
                        {isCreatingOrder ? 'Processing...' : 'Cancel'}
                    </Button>
                    <Button 
                        onClick={handleCreateOrder}
                        disabled={orderItems.length === 0 || !selectedUser || isLoading}
                        className="px-6"
                    >
                        {isCreatingOrder ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating Order...
                            </>
                        ) : (
                            `Create Order (${orderItems.length} items - $${getTotalOrderValue().toFixed(2)})`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ManualOrderDialog;