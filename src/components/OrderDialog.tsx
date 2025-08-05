import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { Main, AddOn, Side, Fruit } from '@/models/item.model';
import { Meal } from '@/models/order.model';
import { Child } from '@/models/user.model';
import { formatDate } from '@/utils/utils';
import { useAppContext } from '@/context/AppContext';
import { School } from '@/models/school.model';
import { v4 as uuidv4 } from 'uuid';
import { isValidDateCheck } from '@/utils/dateValidation';
import { Lock, AlertCircle } from 'lucide-react';

interface OrderDialogProps {
	isOpen: boolean;
	onClose: () => void;
	selectedMain?: Main | null;
	selectedSchool?: School | null;
	editingMeal?: Meal | null;
    adminState?: Child[] | null; // Admin state to override available items
    customerEdit?: boolean; // Flag for customer-restricted editing
	onSave: (meals: Meal | Meal[]) => void;
}

const OrderDialog: React.FC<OrderDialogProps> = ({ 
    isOpen, 
    onClose, 
    selectedMain,
    selectedSchool, 
    editingMeal,
    adminState,
    customerEdit = false,
    onSave 
}) => {
	const { state } = useAppContext();
	
	const [currentMain, setCurrentMain] = useState<Main | null>(null);
	const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
	const [selectedSide, setSelectedSide] = useState<Side | undefined>();
	const [selectedFruit, setSelectedFruit] = useState<Fruit | undefined>();
	const [selectedChildren, setSelectedChildren] = useState<Child[]>([]);
	const [selectedDates, setSelectedDates] = useState<Date[]>([]);
	const [isMainOnly, setIsMainOnly] = useState<boolean>(false);
    const [calendarKey, setCalendarKey] = useState<string>(`calendar-${selectedMain?.id || 'none'}`);
	// Use the school from editingMeal if in edit mode and selectedSchool is not provided
	const effectiveSchool = selectedSchool || editingMeal?.school;
	
    // Derived values
    const isEditMode = !!editingMeal;
    const overrideWithAdminState = !!adminState;

    // Determine if main and add-ons should be disabled
    const isMainDisabled = isEditMode && (customerEdit || !adminState);
    const areAddOnsDisabled = isEditMode && customerEdit;

    const availableMains = useMemo(() => {
        if (!effectiveSchool?.menuItems) {
            return [];
        }
        return state.mains.filter(main => 
            main.isActive && effectiveSchool.menuItems?.includes(main.id)
        );
    }, [effectiveSchool, state.mains]);

    const availableAddOns = useMemo(() => {
        if (!currentMain?.addOns || !currentMain) {
            return [];
        }
        return state.addOns.filter(addon => 
            addon.isActive && currentMain.addOns?.includes(addon.id)
        );
    }, [currentMain, state.addOns]);

    const children = overrideWithAdminState ? adminState : state.user?.children ?? [];
    const sides = state.sides ?? [];
    const fruits = state.fruits ?? [];

	// Single initialization effect
	useEffect(() => {
		if (!isOpen) {
			// Reset when closing
			setCurrentMain(null);
			setSelectedAddOns([]);
			setSelectedSide(undefined);
			setSelectedFruit(undefined);
			setSelectedChildren([]);
			setSelectedDates([]);
			setIsMainOnly(false);
			return;
		}

		if (isEditMode && editingMeal) {
			// Edit mode - populate with existing meal data
			setCurrentMain(editingMeal.main);
			setSelectedAddOns(editingMeal.addOns);
			setSelectedSide(editingMeal.side);
			setSelectedFruit(editingMeal.fruit);
			setSelectedChildren([editingMeal.child]);
			setSelectedDates([new Date(editingMeal.deliveryDate)]);
			setIsMainOnly(editingMeal.addOns.some(addon => 
				addon.display.toLowerCase().includes('main only')
			));
		} else {
			// Add mode - start fresh or with selected main
			const initialMain = selectedMain || availableMains[0] || null;
			setCurrentMain(initialMain);
			setSelectedAddOns([]);
			// Set default side and fruit if available
            if (!initialMain?.disableSidesSelection) {
                const activeSides = sides.filter(side => side.isActive);
                const activeFruits = fruits.filter(fruit => fruit.isActive);
                setSelectedSide(activeSides.length > 0 ? activeSides[0] : undefined);
                setSelectedFruit(activeFruits.length > 0 ? activeFruits[0] : undefined);
            } else {
                setSelectedSide(undefined);
                setSelectedFruit(undefined);
            }

            setSelectedChildren(children.length === 1 ? [children[0]] : []);
			setSelectedDates([]);
			setIsMainOnly(false);
		}
	}, [isOpen, sides, fruits]); // Minimal dependencies to prevent re-initialization

	const handleAddOnToggle = (addonId: string) => {
        if (areAddOnsDisabled) return;

		const addon = availableAddOns.find(a => a.id === addonId);
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

	const handleChildToggle = (childId: string) => {
		const child = children.find(c => c.id === childId);
		if (!child) return;

		if (isEditMode) {
			setSelectedChildren([child]);
		} else {
			const isSelected = selectedChildren.some(c => c.id === childId);
			if (isSelected) {
				setSelectedChildren(selectedChildren.filter(c => c.id !== childId));
			} else {
				setSelectedChildren([...selectedChildren, child]);
			}
		}
	};

	const handleDateSelect = (date: Date | Date[] | undefined) => {
        if (!date) return;

        if (isEditMode) {
            // Single date mode
            const singleDate = Array.isArray(date) ? date[0] : date;
            if (singleDate) {
                setSelectedDates([singleDate]);
            }
        } else {
            // Multiple date mode
            const dates = Array.isArray(date) ? date : [date];
            setSelectedDates(dates);
        }
	};

    const shouldHideSides = isMainOnly || currentMain?.disableSidesSelection;

    const updateMain = (main: Main) => {
        const wasPromo = currentMain?.isPromo;
        const isPromo = main.isPromo;
        
        if ((wasPromo || isPromo) && selectedDates.length > 0) {
            setSelectedDates([]);
            
            if (wasPromo && !isPromo) {
                toast('Dates cleared - switching from promotional to regular menu item', {
                    style: {
                        background: '#3b82f6',
                        color: '#ffffff',
                    },
                });
            } else if (!wasPromo && isPromo) {
                toast('Dates cleared - promotional items have specific available dates', {
                    style: {
                        background: '#3b82f6',
                        color: '#ffffff',
                    },
                });
            } else if (wasPromo && isPromo) {
                toast('Dates cleared - different promotional item selected', {
                    style: {
                        background: '#3b82f6',
                        color: '#ffffff',
                    },
                });
            }
        }

        if (currentMain && currentMain.id !== main.id) {
            const shouldToast = selectedAddOns.length > 0;

            setSelectedAddOns([]);
            setIsMainOnly(false);
            
            // If the new main has disableSidesSelection, clear sides/fruits
            if (main.disableSidesSelection) {
                setSelectedSide(undefined);
                setSelectedFruit(undefined);
            } else {
                // Reset to default sides/fruits if switching to a main that allows them
                const activeSides = sides.filter(side => side.isActive);
                const activeFruits = fruits.filter(fruit => fruit.isActive);
                setSelectedSide(activeSides.length > 0 ? activeSides[0] : undefined);
                setSelectedFruit(activeFruits.length > 0 ? activeFruits[0] : undefined);
            }
            
            if (shouldToast) {
                toast('Add-ons cleared when switching main dishes', {
                    style: {
                        background: '#3b82f6',
                        color: '#ffffff',
                    },
                });
            }
        }

        setCurrentMain(main);
        setCalendarKey(`calendar-${main.id}`);
    }

	const isInvalidDate = (date: Date):boolean => {
        let validDates = [];

        if (currentMain?.isPromo && currentMain?.validDates) {
            validDates = currentMain.validDates;
        } else if (effectiveSchool?.validDates) {
            validDates = effectiveSchool.validDates;
        } else {
            return false; // No valid dates to check against
        }

		return !(isValidDateCheck(date, validDates));
	};

	const calculateTotal = (main: Main, addOns: AddOn[]) => {
		return main.price + addOns.reduce((sum, addon) => sum + addon.price, 0);
	};

	const handleSave = () => {
		// Validation
		if (!currentMain) {
			toast.error('Please select a main dish');
			return;
		}
		if (selectedChildren.length === 0) {
			toast.error('Please select at least one recipient');
			return;
		}
		if (selectedDates.length === 0) {
			toast.error('Please select at least one date');
			return;
		}
        if (!effectiveSchool) {
            toast.error('School information is missing');
            return;
        }
		
		// Validate sides and fruits if not main only
		if (!shouldHideSides) {
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

		try {
			if (isEditMode && editingMeal) {
				// Edit existing meal
				const updatedMeal: Meal = {
					...editingMeal,
					main: currentMain,
					addOns: selectedAddOns,
					side: shouldHideSides ? undefined : selectedSide,
                    fruit: shouldHideSides ? undefined : selectedFruit,
					child: selectedChildren[0],
					deliveryDate: selectedDates[0].toISOString(),
					// For customer edits, keep original total to prevent price manipulation
					total: customerEdit ? editingMeal.total : calculateTotal(currentMain, selectedAddOns),
					school: effectiveSchool,
				};

				onSave(updatedMeal);
			} else {
				// Create new meals
				const newMeals: Meal[] = selectedChildren.flatMap(child =>
					selectedDates.map(date => ({
						id: uuidv4(),
						main: currentMain,
						addOns: selectedAddOns,
						side: shouldHideSides ? undefined : selectedSide,
                        fruit: shouldHideSides ? undefined : selectedFruit,
						child,
						deliveryDate: date.toISOString(),
						total: calculateTotal(currentMain, selectedAddOns),
						school: effectiveSchool,
					}))
				);

				onSave(newMeals);
				toast.success(`${newMeals.length} meal(s) added to cart`);
			}

			onClose();
		} catch (error) {
			console.error('Error saving meal:', error);
			toast.error('An error occurred while saving the meal');
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
				<DialogHeader className="space-y-3">
                    <DialogTitle className="text-xl font-semibold flex items-center justify-between">
                        {isEditMode ? 'Edit Meal Order' : 'Create Meal Order'}
                        <div className="flex items-center gap-2">
                            {customerEdit && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    Customer Edit
                                </Badge>
                            )}
                            {overrideWithAdminState && !customerEdit && (
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                    Admin Mode
                                </Badge>
                            )}
                        </div>
                    </DialogTitle>
                    <DialogDescription>
                        Configure your meal order for delivery to the selected school.
                    </DialogDescription>
                </DialogHeader>

                <div className="mx-1 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                            <span className="text-sm font-semibold text-blue-900 block">
                                Delivering to
                            </span>
                            <span className="text-base font-bold text-blue-800">
                                {effectiveSchool?.name}
                            </span>
                        </div>
                    </div>
                    {customerEdit && (
                        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-800">
                                <strong>Limited editing:</strong> You can only change the recipient, delivery date, side, and fruit. 
                                The main dish and add-ons cannot be modified to ensure pricing accuracy.
                            </p>
                        </div>
                    )}
                </div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
					{/* Left Column - Food Selection */}
					<div className="space-y-6">
						{/* Main Dish Section */}
						<div className={`rounded-lg p-4 space-y-3 ${isMainDisabled ? 'bg-gray-100' : 'bg-gray-50'}`}>
							<div className="flex items-center gap-2">
								<h3 className="text-lg font-semibold text-gray-900">Main Dish</h3>
								{isMainDisabled && <Lock className="h-4 w-4 text-gray-500" />}
							</div>
							<Select
								value={currentMain?.id || ''}
								onValueChange={(value) => {
									const main = availableMains.find(m => m.id === value);
									if (main) updateMain(main);
								}}
								disabled={isMainDisabled}
							>
								<SelectTrigger className={`w-full ${isMainDisabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}>
									<SelectValue placeholder="Select main dish" />
								</SelectTrigger>
								<SelectContent>
									{availableMains.map(main => (
										<SelectItem key={main.id} value={main.id}>
											<span className="flex justify-between items-center w-full">
												{main.isPromo && (
                                                    <Badge variant="promo" className="mr-2">
                                                        Promo
                                                    </Badge>
                                                )}
                                                <span>{main.display}</span>
												<span className="font-medium ml-2">${main.price.toFixed(2)}</span>
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Add-ons Section */}
						{availableAddOns.length > 0 && (
							<div className={`rounded-lg p-4 space-y-3 ${areAddOnsDisabled ? 'bg-gray-100' : 'bg-gray-50'}`}>
								<div className="flex items-center gap-2">
									<h3 className="text-lg font-semibold text-gray-900">Add-ons</h3>
									{areAddOnsDisabled && <Lock className="h-4 w-4 text-gray-500" />}
								</div>
								<div className="space-y-3">
									{availableAddOns.map(addon => (
										<div key={addon.id} className={`flex items-center space-x-3 p-2 rounded ${areAddOnsDisabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-white cursor-pointer'}`}>
											<Checkbox
												id={addon.id}
												checked={selectedAddOns.some(a => a.id === addon.id)}
												onCheckedChange={() => handleAddOnToggle(addon.id)}
												disabled={areAddOnsDisabled}
											/>
											<Label htmlFor={addon.id} className={`flex-1 ${areAddOnsDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
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
						{!shouldHideSides && (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{sides.length > 0 && (
									<div className="bg-gray-50 rounded-lg p-4 space-y-3">
										<h3 className="text-lg font-semibold text-gray-900">Side</h3>
										<RadioGroup 
											value={selectedSide?.id || ''} 
											onValueChange={(value) => {
												const side = sides.find(s => s.id === value);
												setSelectedSide(side);
											}}
											className="space-y-2"
										>
											{sides.filter(side => side.isActive).map(side => (
												<div key={side.id} className="flex items-center space-x-2 p-1">
													<RadioGroupItem value={side.id} id={`side-${side.id}`} />
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
												const fruit = fruits.find(f => f.id === value);
												setSelectedFruit(fruit);
											}}
											className="space-y-2"
										>
											{fruits.filter(fruit => fruit.isActive).map(fruit => (
												<div key={fruit.id} className="flex items-center space-x-2 p-1">
													<RadioGroupItem value={fruit.id} id={`fruit-${fruit.id}`} />
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

					{/* Right Column - Children and Dates */}
					<div className="space-y-6">
						{/* Children Selection */}
						<div className="bg-gray-50 rounded-lg p-4 space-y-3">
							<h3 className="text-lg font-semibold text-gray-900">
								{isEditMode ? 'Child / Recipient' : 'Children / Recipients'}
							</h3>
							<div className="space-y-3">
								{children.map(child => (
									<div key={child.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded">
										<Checkbox
											id={`child-${child.id}`}
											checked={selectedChildren.some(c => c.id === child.id)}
											onCheckedChange={() => handleChildToggle(child.id)}
										/>
										<Label htmlFor={`child-${child.id}`} className="text-sm cursor-pointer font-medium">
											{child.name}
										</Label>
									</div>
								))}
							</div>
						</div>

						{/* Date Selection */}
						<div className="bg-gray-50 rounded-lg p-4 space-y-3">
							<div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {isEditMode ? 'Date' : 'Dates'}
                                </h3>
                                {currentMain?.isPromo && (
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                                        Promo Dates
                                    </Badge>
                                )}
                            </div>
                            
							<div className="flex justify-center">
								{isEditMode ? (
									<Calendar
                                        key={calendarKey}
										mode="single"
										selected={selectedDates[0]}
										onSelect={(date) => handleDateSelect(date)}
										disabled={isInvalidDate}
										className="rounded-md border bg-white"
									/>
								) : (
									<Calendar
                                        key={calendarKey}
										mode="multiple"
										selected={selectedDates}
										onSelect={(dates) => handleDateSelect(dates)}
										disabled={isInvalidDate}
										className="rounded-md border bg-white"
									/>
								)}
							</div>
							{selectedDates.length > 0 && (
								<div className="mt-3 p-3 bg-white rounded border">
									<p className="text-sm font-medium text-gray-700 mb-1">Selected Dates:</p>
									<p className="text-sm text-gray-600">
										{selectedDates.map(d => formatDate(d.toISOString())).join(', ')}
									</p>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Total Section */}
				{currentMain && (
					<div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border">
						<div className="flex justify-between items-center mb-2">
							<span className="text-lg font-semibold text-gray-900">
								{customerEdit && isEditMode ? 'Original total per meal:' : 'Total per meal:'}
							</span>
							<span className="text-xl font-bold text-green-600">
								${customerEdit && isEditMode ? editingMeal?.total.toFixed(2) : calculateTotal(currentMain, selectedAddOns).toFixed(2)}
							</span>
						</div>
						{customerEdit && isEditMode && (
							<p className="text-xs text-gray-600 mt-1">
								* Price remains unchanged when editing existing orders
							</p>
						)}
						{!isEditMode && selectedChildren.length > 0 && selectedDates.length > 0 && (
							<div className="flex justify-between items-center pt-2 border-t border-gray-200">
								<span className="text-sm text-gray-600">
									Total for {selectedChildren.length * selectedDates.length} meal(s):
								</span>
								<span className="text-lg font-bold text-green-600">
									${(calculateTotal(currentMain, selectedAddOns) * 
									   selectedChildren.length * 
									   selectedDates.length).toFixed(2)}
								</span>
							</div>
						)}
					</div>
				)}

				<DialogFooter className="mt-6 gap-3">
					<Button variant="outline" onClick={onClose} className="px-6">
						Cancel
					</Button>
					<Button onClick={handleSave} className="px-6">
						{isEditMode ? 'Save Changes' : 'Add to Cart'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default OrderDialog;