import React, { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/16/solid';
import { getCurrentUser } from '../services/auth';
import { getMains, getSides, getFruits, getDrinks, getAddOns, getPlatters } from '../services/item-service';
import toast from 'react-hot-toast';
import { AddOn, Drink, Fruit, Main, Platter, Side } from '../models/item.model';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import ItemModal from './ItemModal';
import MainItemModal from './MainItemModal';
import { useAppContext } from '../context/AppContext';

import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { EyeOff } from 'lucide-react';

const itemTypeOptions = [
	{ value: 'main', label: 'Main' },
	{ value: 'side', label: 'Side' },
	{ value: 'fruit', label: 'Fruit' },
	{ value: 'drink', label: 'Drink' },
	{ value: 'addon', label: 'Add On' },
	{ value: 'platter', label: 'Platter' },
];

type MenuItem = Main | Side | AddOn | Fruit | Drink | Platter;

const ItemController: React.FC = () => {
	const { state, dispatch } = useAppContext();
	const [currentItem, setCurrentItem] = useState<MenuItem | null>(null);
	const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
	const [selectedType, setSelectedType] = useState({ value: 'main', label: 'Main' });
	const [isItemModalOpen, setIsItemModalOpen] = useState(false);
	const [isMainModalOpen, setIsMainModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
	const [selectedItemType, setSelectedItemType] = useState<'side' | 'fruit' | 'drink' | 'addon' | 'platter' | null>(null);
	const [isAdmin, setIsAdmin] = useState(false);
	const [hideUnavailableItems, setHideUnavailableItems] = useState(false);
	
	const toggleUnavailableItems = () => {
		setHideUnavailableItems((prev) => !prev);
	}

	useEffect(() => {
		const fetchItemsAndCheckAdmin = async () => {
			try {
				const user = await getCurrentUser();
				if (!user) {
					toast.error('User not authenticated');
					return;
				}

				setIsAdmin(user.isAdmin);

				const [mainItems, sideItems, fruitItems, drinkItems, addOnItems, platters] = await Promise.all([
					getMains(),
					getSides(),
					getFruits(),
					getDrinks(),
					getAddOns(),
					getPlatters()
				]);

				const allItems = [
					...(mainItems.success && mainItems.data ? mainItems.data : []),
					...(sideItems.success && sideItems.data ? sideItems.data : []),
					...(fruitItems.success && fruitItems.data ? fruitItems.data : []),
					...(drinkItems.success && drinkItems.data ? drinkItems.data : []),
					...(addOnItems.success && addOnItems.data ? addOnItems.data : []),
					...(platters.success && platters.data ? platters.data : [])
				];

				dispatch({ type: 'SET_MENU_ITEMS', payload: allItems });
			} catch (error) {
				toast.error((error as Error).message);
			}
		};

		fetchItemsAndCheckAdmin();
	}, [dispatch]);

	useEffect(() => {
		// Filter items based on selected type
		setFilteredItems(state.items.filter((item) => getItemType(item) === selectedType.value));
	}, [selectedType, state.items]);

	const handleTypeChange = (value: string) => {
		setSelectedType({
			value,
			label: itemTypeOptions.find((option) => option.value === value)?.label || 'Main',
		});
	};

	const uploadImage = async (file: File): Promise<string> => {
		const fileId = uuidv4();
		const fileExtension = file.name.split('.').pop();
		const fileName = `${fileId}.${fileExtension}`;
		const storageRef = ref(storage, `main-images/${fileName}`);

		await uploadBytes(storageRef, file);
		const downloadURL = await getDownloadURL(storageRef);
		return downloadURL;
	};

	const getItemType = (item: MenuItem): 'main' | 'side' | 'fruit' | 'drink' | 'addon' | 'platter' => {
		if (item instanceof Main) return 'main';
		if (item instanceof Side) return 'side';
		if (item instanceof Fruit) return 'fruit';
		if (item instanceof Drink) return 'drink';
		if (item instanceof AddOn) return 'addon';
		if (item instanceof Platter) return 'platter';
		throw new Error('Unknown item type');
	};

	const formatPrice = (price: number): string => {
		if (price < 0) {
			return `-$${price.toFixed(2).slice(1)}`;
		} else {
			return `$${price.toFixed(2)}`;
		}
	}

	const handleSubmitMainItem = async (item: Main, imageFile: File | null) => {
		try {
			if (imageFile) {
				const imageUrl = await uploadImage(imageFile);
				item.image = imageUrl;
			}

            if (item.isPromo) {
				if (!item.validDates) {
					item.validDates = [];
				}
			} else {
				item.validDates = [];
			}

			const response = await addOrUpdateItem(item);

			if (response.success) {
				dispatch({
					type: modalMode === 'add' ? 'ADD_MENU_ITEM' : 'UPDATE_MENU_ITEM',
					payload: item,
				});
				toast.success(`Main item ${modalMode === 'add' ? 'added' : 'updated'} successfully`);
				setIsMainModalOpen(false);
				setCurrentItem(null);
			} else {
				toast.error(response.error || `Failed to ${modalMode} main item`);
			}
		} catch (error) {
			toast.error((error as Error).message);
		}
	};

	const handleSubmitItem = async (item: Side | Fruit | Drink | AddOn | Platter, imageFile: File | null) => {
		try {
			if (imageFile && (item instanceof Drink || item instanceof Platter)) {
				const imageUrl = await uploadImage(imageFile);
				item.image = imageUrl;
			}

			const response = await addOrUpdateItem(item);

			if (response.success) {
				dispatch({
					type: modalMode === 'add' ? 'ADD_MENU_ITEM' : 'UPDATE_MENU_ITEM',
					payload: item,
				});
				toast.success(`Item ${modalMode === 'add' ? 'added' : 'updated'} successfully`);
				setIsItemModalOpen(false);
			} else {
				toast.error(response.error || `Failed to ${modalMode} item`);
			}
		} catch (error) {
			toast.error((error as Error).message);
		}
	};

	const getCollectionName = (item: MenuItem): string => {
		if (item instanceof Main) return 'mains-test';
		if (item instanceof Side) return 'sides-test';
		if (item instanceof Fruit) return 'fruits-test';
		if (item instanceof Drink) return 'drinks-test';
		if (item instanceof AddOn) return 'addon-test';
		if (item instanceof Platter) return 'platters-test';
		throw new Error('Invalid item type');
	};

	const addOrUpdateItem = async (item: MenuItem): Promise<{ success: boolean; data?: MenuItem; error?: string }> => {
		try {
			const collectionName = getCollectionName(item);
			const itemRef = doc(db, collectionName, item.id);

			const docSnap = await getDoc(itemRef);

            if (item instanceof Main) {
				if (item.isPromo) {
					if (!item.validDates) {
						item.validDates = [];
					}
				} else {
					item.validDates = [];
				}
			}

			const itemData: any = { ...item };
			delete itemData.id;

			if (docSnap.exists()) {
				await updateDoc(itemRef, itemData);
			} else {
				await setDoc(itemRef, itemData);
			}

			return { success: true, data: item };
		} catch (error) {
			console.error('Error adding/updating item: ', error);
			return { success: false, error: (error as Error).message };
		}
	};

	const columnConfigs = {
        main: ['name', 'allergens', 'addons', 'price', 'featured', 'promo', 'validDates'],
        addon: ['name', 'price'],
        side: ['name'],
        fruit: ['name'],
        drink: ['name', 'price'],
        platter: ['name', 'price']
    };

// Updated renderCell function to handle validDates
const renderCell = (item: MenuItem, column: string) => {
	switch (column) {
		case 'name':
			return item.display;
		case 'price':
			return (item instanceof Main || item instanceof Drink || item instanceof AddOn || item instanceof Platter) && item.price !== undefined
				? formatPrice(item.price)
				: 'N/A';
		case 'allergens':
			return item instanceof Main ? item.allergens?.join(', ') || 'None' : 'N/A';
        case 'addons':
            if (item instanceof Main && item.addOns && item.addOns.length > 0) {
                // Get addon names from state
                const addonNames = item.addOns.map(addonId => {
                    const addon = state.items.find(i => i.id === addonId && i instanceof AddOn);
                    return addon ? addon.display : addonId;
                });
                
                if (addonNames.length <= 3) {
                    return addonNames.join(', ');
                } else {
                    const displayed = addonNames.slice(0, 2);
                    const remaining = addonNames.length - 2;
                    return `${displayed.join(', ')} + ${remaining} more...`;
                }
            }
            return 'None';
		case 'featured':
			return item instanceof Main ? (item.isFeatured ? 'Yes' : 'No') : 'N/A';
		case 'promo':
			return item instanceof Main ? (item.isPromo ? 'Yes' : 'No') : 'N/A';
        case 'validDates':
            if (item instanceof Main && item.isPromo && item.validDates && item.validDates.length > 0) {
                const formatDate = (dateString: string) => {
                    const date = new Date(dateString);
                    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = date.getDate();
                    const month = date.toLocaleDateString('en-US', { month: 'short' });
                    const suffix = dayNum % 10 === 1 && dayNum !== 11 ? 'st' : 
                                  dayNum % 10 === 2 && dayNum !== 12 ? 'nd' : 
                                  dayNum % 10 === 3 && dayNum !== 13 ? 'rd' : 'th';
                    return `${day} ${dayNum}${suffix} ${month}`;
                };
                
                const formattedDates = item.validDates.map(formatDate);
                
                if (formattedDates.length <= 2) {
                    return formattedDates.join(', ');
                } else {
                    const displayed = formattedDates.slice(0, 2);
                    const remaining = formattedDates.length - 2;
                    return `${displayed.join(', ')} + ${remaining} more...`;
                }
            }
            return item instanceof Main && item.isPromo ? 'No dates set' : 'N/A';
		default:
			return 'N/A';
	}
};

	const handleCloseModal = () => {
		setIsItemModalOpen(false);
		setCurrentItem(null);
		setSelectedItemType(null);
	};

	const handleCloseMainModal = () => {
		setIsMainModalOpen(false);
		setCurrentItem(null);
	};

	const handleOpenModal = (mode: 'add' | 'edit', item?: MenuItem) => {
		setModalMode(mode);
		
		if (mode === 'edit' && item) {
			// Edit mode - determine which modal based on item type
			if (item instanceof Main) {
				setCurrentItem(item);
				setIsMainModalOpen(true);
			} else {
				setCurrentItem(item);
				const itemType = getItemType(item);
				setSelectedItemType(itemType === 'main' ? null : itemType);
				setIsItemModalOpen(true);
			}
		} else if (mode === 'add') {
			// Add mode - use currently selected type
			if (selectedType.value === 'main') {
				setCurrentItem(null);
				setIsMainModalOpen(true);
			} else {
				setCurrentItem(null);
				setSelectedItemType(selectedType.value as 'side' | 'fruit' | 'drink' | 'addon' | 'platter');
				setIsItemModalOpen(true);
			}
		}
	};

	if (!isAdmin) {
		return <div>You do not have permission to access this page.</div>;
	}

	const columns = columnConfigs[selectedType.value as keyof typeof columnConfigs];

	return (
		<div className="w-full px-4 space-y-4">
			<div className="flex flex-col md:flex-row justify-between items-center gap-4">
				<h2 className="text-3xl font-bold">Menu Items</h2>
				<div className="flex flex-col md:flex-row items-center gap-2">
					<Select
						onValueChange={handleTypeChange}
						value={selectedType.value}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Select item type" />
						</SelectTrigger>
						<SelectContent>
							{itemTypeOptions.map((option) => (
								<SelectItem
									key={option.value}
									value={option.value}
								>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						onClick={() => toggleUnavailableItems()}
					 	variant={'outline'}>
						<EyeOff className="h-5 w-5 mr-2" />
						Toggle Unavailable Items
					</Button>
					<Button
						onClick={() => handleOpenModal('add')}
						className="bg-brand-dark-green text-brand-cream"
					>
						<PlusIcon className="h-5 w-5 mr-2" />
						Add New {selectedType.label}
					</Button>
				</div>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							{columns.map((column) => (
								<TableHead
									key={column}
								>
									{column.charAt(0).toUpperCase() + column.slice(1)}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredItems.map((item) => {
							// Skip rendering items where isActive is explicitly false and toggle is on
							if (hideUnavailableItems && item.isActive === false) {
								return null;
							}
							
							return (
								<TableRow
									key={item.id}
									className="cursor-pointer"
									onClick={() => handleOpenModal('edit', item)}
								>
									{columns.map((column) => (
										<TableCell
											key={`${item.id}-${column}`}
											className="overflow-hidden"
										>
											{renderCell(item, column)}
										</TableCell>
									))}
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>

			<MainItemModal
				isOpen={isMainModalOpen}
				onClose={handleCloseMainModal}
				onSubmit={handleSubmitMainItem}
				item={currentItem as Main | null}
				mode={modalMode}
			/>

			<ItemModal
				isOpen={isItemModalOpen}
				onClose={handleCloseModal}
				onSubmit={handleSubmitItem}
				item={currentItem instanceof Main ? null : currentItem}
				mode={modalMode}
				itemType={selectedItemType}
			/>
		</div>
	);
};

export default ItemController;