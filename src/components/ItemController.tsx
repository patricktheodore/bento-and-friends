import React, { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/16/solid';
import { getCurrentUser } from '../services/auth';
import { getMains, getProbiotics, getFruits, getDrinks, getAddOns, getPlatters } from '../services/item-service';
import toast from 'react-hot-toast';
import { AddOn, Drink, Fruit, Main, Platter, Probiotic } from '../models/item.model';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import ItemModal from './ItemModal';
import { useAppContext } from '../context/AppContext';

import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const itemTypeOptions = [
	{ value: 'all', label: 'All Items' },
	{ value: 'main', label: 'Main' },
	{ value: 'probiotic', label: 'Probiotic' },
	{ value: 'fruit', label: 'Fruit' },
	{ value: 'drink', label: 'Drink' },
	{ value: 'addon', label: 'Add On' },
	{ value: 'platter', label: 'Platter' },
];

const columnConfigs = {
	all: ['image', 'name', 'type', 'price'],
	main: ['image', 'name', 'allergens', 'price'],
	addon: ['name', 'price'],
	probiotic: ['name'],
	fruit: ['name'],
	drink: ['image', 'name', 'price'],
	platter: ['image', 'name', 'price']
};

type MenuItem = Main | Probiotic | AddOn | Fruit | Drink | Platter;

const ItemController: React.FC = () => {
	const { state, dispatch } = useAppContext();
	const [currentItem, setCurrentItem] = useState<MenuItem | null>(null);
	const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
	const [selectedType, setSelectedType] = useState({ value: 'all', label: 'All Items' });
	const [isItemModalOpen, setIsItemModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
	const [selectedItemType, setSelectedItemType] = useState<'main' | 'probiotic' | 'fruit' | 'drink' | 'addon' | 'platter' | null>(
		'main'
	);
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		const fetchItemsAndCheckAdmin = async () => {
			try {
				const user = await getCurrentUser();
				if (!user) {
					toast.error('User not authenticated');
					return;
				}

				setIsAdmin(user.isAdmin);

				const [mainItems, probioticItems, fruitItems, drinkItems, addOnItems, platters] = await Promise.all([
					getMains(),
					getProbiotics(),
					getFruits(),
					getDrinks(),
					getAddOns(),
					getPlatters()
				]);

				const allItems = [
					...(mainItems.success && mainItems.data ? mainItems.data : []),
					...(probioticItems.success && probioticItems.data ? probioticItems.data : []),
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
		if (selectedType.value === 'all') {
			setFilteredItems(state.items);
		} else {
			setFilteredItems(state.items.filter((item) => getItemType(item) === selectedType.value));
		}
	}, [selectedType, state.items]);

	const handleTypeChange = (value: string) => {
		setSelectedType({
			value,
			label: itemTypeOptions.find((option) => option.value === value)?.label || 'All Items',
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

	const getItemType = (item: MenuItem): 'main' | 'probiotic' | 'fruit' | 'drink' | 'addon' | 'platter' => {
		if (item instanceof Main) return 'main';
		if (item instanceof Probiotic) return 'probiotic';
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

	const handleSubmitItem = async (item: MenuItem, imageFile: File | null) => {
		try {
			if (imageFile && (item instanceof Main || item instanceof Drink || item instanceof Platter)) {
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
		if (item instanceof Main) return 'mains';
		if (item instanceof Probiotic) return 'probiotics';
		if (item instanceof Fruit) return 'fruits';
		if (item instanceof Drink) return 'drinks';
		if (item instanceof AddOn) return 'addon';
		if (item instanceof Platter) return 'platters';
		throw new Error('Invalid item type');
	};

	const addOrUpdateItem = async (item: MenuItem): Promise<{ success: boolean; data?: MenuItem; error?: string }> => {
		try {
			const collectionName = getCollectionName(item);
			const itemRef = doc(db, collectionName, item.id);

			const docSnap = await getDoc(itemRef);

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

	const renderCell = (item: MenuItem, column: string) => {
		switch (column) {
			case 'image':
				return (item instanceof Main || item instanceof Drink || item instanceof Platter) && item.image ? (
					<div className="w-20 h-20 p-2 flex items-center justify-center">
						<img
							src={item.image}
							alt={item.display}
							className="max-w-full max-h-full object-contain rounded-md shadow"
						/>
					</div>
				) : null;
			case 'name':
				return item.display;
			case 'type':
				return getItemType(item).charAt(0).toUpperCase() + getItemType(item).slice(1);
			case 'price':
				return (item instanceof Main || item instanceof Drink || item instanceof AddOn) && item.price
					? `${formatPrice(item.price)}`
					: 'N/A';
			case 'allergens':
				return item instanceof Main ? item.allergens?.join(', ') || 'None' : 'N/A';
			default:
				return 'N/A';
		}
	};

	const handleCloseModal = () => {
		setIsItemModalOpen(false);
		setCurrentItem(null);
		setSelectedItemType(null);
	};

	const handleOpenModal = (mode: 'add' | 'edit', item?: MenuItem) => {
		setModalMode(mode);
		setCurrentItem(item || null);
		setSelectedItemType(item ? getItemType(item) : null);
		setIsItemModalOpen(true);
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
						onClick={() => handleOpenModal('add')}
						className="bg-brand-dark-green text-brand-cream"
					>
						<PlusIcon className="h-5 w-5 mr-2" />
						Add New Item
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
									className={column === 'image' ? 'w-32' : ''}
								>
									{column === 'image' ? '' : column.charAt(0).toUpperCase() + column.slice(1)}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredItems.map((item) => (
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
						))}
					</TableBody>
				</Table>
			</div>

			<ItemModal
				isOpen={isItemModalOpen}
				onClose={handleCloseModal}
				onSubmit={handleSubmitItem}
				item={currentItem}
				mode={modalMode}
				itemType={selectedItemType}
			/>
		</div>
	);
};

export default ItemController;
