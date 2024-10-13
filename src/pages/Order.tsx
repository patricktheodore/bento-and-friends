import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import MenuItemCard from '../components/MenuItemCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Child } from '../models/user.model';
import { Checkbox } from '@/components/ui/checkbox';
import { Meal } from '@/models/order.model';
import { Main } from '@/models/item.model';
import { School } from '@/models/school.model';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { formatDate } from '@/utils/utils';
import { Badge } from '@/components/ui/badge';
import { updateUserInFirebase } from '@/services/user-service';

const OrderPage: React.FC = () => {
	const { state, dispatch } = useAppContext();
	const [isAdding, setIsAdding] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedMain, setSelectedMain] = useState<string | null>(null);
	const [selectedChild, setSelectedChild] = useState<string | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
	const [newChild, setNewChild] = useState<Omit<Child, 'id'>>(new Child());
	const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
	const [otherAllergen, setOtherAllergen] = useState('');
	const [step, setStep] = useState(1);
	const [isAddingChild, setIsAddingChild] = useState(false);
	const [isTeacher, setIsTeacher] = useState(false);

	const allergenOptions = ['Celiac', 'Dairy', 'Gluten', 'Soy', 'Eggs', 'Lactose', 'Other'];

	useEffect(() => {
		if (state.user?.children.length === 1) {
			setSelectedChild(state.user.children[0].id);
		}
	}, [state.user?.children]);

	const totalPrice = useMemo(() => {
		let total = 0;
		if (selectedMain) {
			const mainItem = state.mains.find((main) => main.id === selectedMain);
			total += typeof mainItem?.price === 'number' ? mainItem.price : 0;
		}
		selectedAddons.forEach((addonId) => {
			const addon = state.addOns.find((addon) => addon.id === addonId);
			total += typeof addon?.price === 'number' ? addon.price : 0;
		});
		return total;
	}, [selectedMain, selectedAddons, state.mains, state.addOns]);

	const formatPrice = (price: number | undefined): string => {
		return typeof price === 'number' ? price.toFixed(2) : 'N/A';
	};

	const handleAllergenChange = (value: string) => {
		setSelectedAllergens((prev) => {
			if (prev.includes(value)) {
				return prev.filter((a) => a !== value);
			} else {
				return [...prev, value];
			}
		});
	};

	const getAllergenString = () => {
		const allergens = [...selectedAllergens.filter((a) => a !== 'Other')];
		if (selectedAllergens.includes('Other') && otherAllergen) {
			allergens.push(otherAllergen);
		}
		return allergens.join(', ');
	};

	const handleOrderNow = (itemId: string) => {
		setSelectedMain(itemId);
		setIsModalOpen(true);
		setStep(1);
	};

	const handleNextStep = () => {
		if (step < 4) setStep(step + 1);
	};

	const handlePrevStep = () => {
		if (step > 1) setStep(step - 1);
	};

	const handleAddToCart = () => {
		setIsAdding(true);
		setIsModalOpen(false);
	
		const selectedChildData = state.user?.children.find((child) => child.id === selectedChild);
	
		const payload: Meal = {
			id: uuidv4(),
			main: state.mains.find((main) => main.id === selectedMain) as Main,
			addOns: state.addOns.filter((addon) => selectedAddons.includes(addon.id)),
			probiotic: undefined,
			fruit: undefined,
			drink: undefined,
			school: state.schools.find((school) => school.name === selectedChildData?.school) as School,
			orderDate: new Date(selectedDate as Date).toISOString(),
			child: selectedChildData as Child,
			total: totalPrice,
		}
	
		dispatch({
			type: 'ADD_TO_CART',
			payload: payload
		})
	
		toast.success('Added to cart!');
		
		setSelectedMain(null);
		setSelectedAddons([]);
		setSelectedChild(null);
		setSelectedDate(undefined);
		setStep(1);
		setIsAdding(false);
	};

	const handleAddOnToggle = (addonId: string) => {
		setSelectedAddons((prev) =>
			prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
		);
	};

	const handleAddChild = () => {
		if (state.user) {
			const allergens = getAllergenString();
			const newChildObject = new Child(
				newChild.name,
				newChild.year,
				isTeacher,
				newChild.school,
				newChild.className,
				allergens,
			);
			const updatedUser = {
				...state.user,
				children: [...state.user.children, newChildObject],
			};
			dispatch({ type: 'UPDATE_USER', payload: updatedUser });
			updateUserInFirebase(updatedUser);
			setSelectedChild(newChildObject.id);
			setIsAddingChild(false);
			setNewChild(new Child());
			setSelectedAllergens([]);
			setOtherAllergen('');
		}
	};

	const renderSelectionSummary = () => {
		const selectedMainItem = state.mains.find((main) => main.id === selectedMain);
		return (
			<div className="bg-green-100 p-3 rounded-md mb-4">
				<h3 className="text-sm font-semibold mb-2">Your Current Selection:</h3>
				{selectedMainItem && (
					<p>
						Main: {selectedMainItem.display} (${formatPrice(selectedMainItem.price)})
					</p>
				)}
				<p className='text-xs'>+ Seasonal Fruit & Yogurt <span className='italic'>(included with all meals)</span></p>
				{selectedAddons.length > 0 && (
					<p className='text-xs'> 
						{' + '}
						{selectedAddons
							.map((id) => {
								const addon = state.addOns.find((addon) => addon.id === id);
								return `${addon?.display} ($${formatPrice(addon?.price)})`;
							})
							.join(', ')}
					</p>
				)}
				<p className="font-semibold mt-2">Total: ${formatPrice(totalPrice)}</p>
			</div>
		);
	};

	const renderAddonsAndNotes = () => {
		return (
			<div className="space-y-4">
				{renderSelectionSummary()}
				<h2 className="text-md font-semibold mb-4">Add-ons and Notes</h2>
				<div className="space-y-2">
					{state.addOns.map((addon) => (
						<div
							key={addon.id}
							className="flex items-center justify-between"
						>
							<div className="flex items-center space-x-2">
								<Checkbox
									id={addon.id}
									checked={selectedAddons.includes(addon.id)}
									onCheckedChange={() => handleAddOnToggle(addon.id)}
								/>
								<Label htmlFor={addon.id}>{addon.display}</Label>
							</div>
							<span>${formatPrice(addon.price)}</span>
						</div>
					))}
				</div>
			</div>
		);
	};

	const renderChildSelection = () => {
		if (isAddingChild) {
			return (
				<div className="space-y-4">
                <h2 className="text-lg font-semibold mb-4">Add a New Child</h2>
                <div className="space-y-2">
                    <Label htmlFor="childName">Name*</Label>
                    <Input
                        id="childName"
                        value={newChild.name}
                        onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="childSchool">School*</Label>
                    <Select
                        value={newChild.school}
                        onValueChange={(value) => setNewChild({ ...newChild, school: value })}
                        required
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a school" />
                        </SelectTrigger>
                        <SelectContent>
                            {state.schools.map((school) => (
                                <SelectItem
                                    key={school.id}
                                    value={school.name}
                                >
                                    {school.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
				<div className="flex items-center space-x-2">
					<Checkbox
						id="isTeacher"
						checked={isTeacher}
						onCheckedChange={(checked) => setIsTeacher(checked as boolean)}
					/>
					<Label htmlFor="isTeacher">Is this member a teacher?</Label>
				</div>
				{!isTeacher && (							
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="childYear">Year*</Label>
							<Input
								id="childYear"
								value={newChild.year}
								onChange={(e) => setNewChild({ ...newChild, year: e.target.value })}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="childClass">Class*</Label>
							<Input
								id="childClass"
								value={newChild.className}
								onChange={(e) => setNewChild({ ...newChild, className: e.target.value })}
								required
							/>
						</div>
					</div>
				)}
				<div className="space-y-2">
                    <Label htmlFor="allergens">Allergens / Dietaries</Label>
                    <Select onValueChange={handleAllergenChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Allergens" />
                        </SelectTrigger>
                        <SelectContent>
                            {allergenOptions.map((allergen) => (
                                <SelectItem
                                    key={allergen}
                                    value={allergen}
                                >
                                    {allergen}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {selectedAllergens.map((allergen) => (
                            <Badge
                                key={allergen}
                                variant="secondary"
                                className="cursor-pointer"
                                onClick={() => handleAllergenChange(allergen)}
                            >
                                {allergen} ✕
                            </Badge>
                        ))}
                    </div>
                    {selectedAllergens.includes('Other') && (
                        <Input
                            placeholder="Enter other allergen"
                            value={otherAllergen}
                            onChange={(e) => setOtherAllergen(e.target.value)}
                            className="mt-2"
                        />
                    )}
                </div>
                <div className="w-full justify-end flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsAddingChild(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={!newChild.name|| !newChild.school || (!isTeacher && (!newChild.year || !newChild.className))}
                        onClick={handleAddChild}
                    >
                        Save for future use
                    </Button>
                </div>
            </div>
			);
		}

		return (
			<div className="space-y-4">
				<h2 className="text-md font-semibold">Select Recipient</h2>
				{state.user?.children.length === 0 ? (
					<p>No children/members added yet. Please add one to continue.</p>
				) : (
					<Select
						value={selectedChild || undefined}
						onValueChange={setSelectedChild}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select recipient..." />
						</SelectTrigger>
						<SelectContent>
							{state.user?.children.map((child) => (
								<SelectItem
									key={child.id}
									value={child.id}
								>
									{child.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
				<Button
					variant={'outline'}
					onClick={() => setIsAddingChild(true)}
				>
					Add Child/Member
				</Button>
			</div>
		);
	};

	const isValidDate = (date: Date) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		
		const day = date.getDay();
		const isWeekend = day === 0 || day === 6;
		const isPast = date <= today;
		const isBlocked = state.blockedDates.some(
			blockedDate => new Date(blockedDate).toDateString() === date.toDateString()
		);

		return isWeekend || isPast || isBlocked;
	};

	const renderStepContent = () => {
		switch (step) {
			case 1:
				return renderAddonsAndNotes();
			case 2:
				return (
					<>
						{renderSelectionSummary()}
						{renderChildSelection()}
					</>
				);
			case 3:
				return (
					<>
						{renderSelectionSummary()}
						<div>
							<h2 className="text-md font-semibold mb-4">Select a Date</h2>
							<div className="w-full flex justify-center">
								<Calendar
									mode="single"
									selected={selectedDate}
									onSelect={setSelectedDate}
									disabled={isValidDate}
									className="rounded-md border"
								/>
							</div>
						</div>
					</>
				);
			case 4:
				const selectedChildData = state.user?.children.find((child) => child.id === selectedChild);
				return (
					<div className="space-y-4">
						{renderSelectionSummary()}
						<div className="bg-gray-100 p-3 rounded-md">
							<h3 className="text-sm font-semibold mb-2">Delivery Details:</h3>
							<p>For: {selectedChildData?.name}</p>
							<p>At: {selectedChildData?.school}</p>
							<p>On: {selectedDate && formatDate(selectedDate.toISOString())}</p>
						</div>
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<div className="container mx-auto p-4 py-8">
			<h1 className="text-5xl md:text-6xl font-bold leading-tight">
				Order
			</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
				{state.mains.map((item) => (
					<MenuItemCard
						key={item.id}
						image={item.image}
						title={item.display}
						allergens={item.allergens}
						description={item.description}
						isVegetarian={item.isVegetarian}
						onOrderNow={() => handleOrderNow(item.id)}
					/>
				))}
			</div>

			<Dialog
				open={isModalOpen}
				onOpenChange={setIsModalOpen}
			>
				<DialogContent className="sm:max-w-[400px]">
					<DialogHeader>
						<DialogTitle>Complete Your Meal</DialogTitle>
					</DialogHeader>
					{renderStepContent()}
					<div className="flex justify-between mt-4">
						<div>{step > 1 && <Button onClick={handlePrevStep}>Previous</Button>}</div>
						<div>
							{step < 4 ? (
								<Button
									onClick={handleNextStep}
									disabled={
										(step === 2 && !selectedChild && !isAddingChild) ||
										(step === 2 && isAddingChild && (!newChild.name || !newChild.className || !newChild.school || !newChild.year)) ||
										(step === 3 && !selectedDate)
									}
								>
									Next
								</Button>
							) : (
								<Button disabled={isAdding} onClick={handleAddToCart}>Add to Cart</Button>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default OrderPage;
