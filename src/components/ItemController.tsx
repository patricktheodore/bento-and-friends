import React, { useState, useEffect } from 'react';
import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/16/solid';
import { getCurrentUser } from '../services/auth';
import { getMains, getProbiotics, getFruits, getDrinks, getAddOns } from '../services/item-service';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { AddOn, Drink, Fruit, Main, Probiotic } from '../models/item.model';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import ItemModal from './ItemModal';
import { useAppContext } from '../context/AppContext';

const itemTypeOptions = [
    { value: 'all', label: 'All Items' },
    { value: 'main', label: 'Main' },
    { value: 'probiotic', label: 'Probiotic' },
    { value: 'fruit', label: 'Fruit' },
    { value: 'drink', label: 'Drink' },
    { value: 'addon', label: 'Add On' },
  ];

  const columnConfigs = {
    all: ['image', 'name', 'type', 'price'],
    main: ['image', 'name', 'allergens', 'price'],
    addon: ['name', 'price'],
    probiotic: ['name'],
    fruit: ['name'],
    drink: ['image', 'name', 'price'],
};

type MenuItem = Main | Probiotic | AddOn | Fruit | Drink;

const ItemController: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [currentItem, setCurrentItem] = useState<Main | Probiotic | Fruit | Drink | AddOn | null>(null);
    const [filteredItems, setFilteredItems] = useState<(Main | Probiotic | Fruit | Drink | AddOn)[]>([]);
    const [selectedType, setSelectedType] = useState({ value: 'all', label: 'All Items' });
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [selectedItemType, setSelectedItemType] = useState<'main' | 'probiotic' | 'fruit' | 'drink' | 'addon' | null>('main');
    const [isAdmin, setIsAdmin] = useState(false);
    const [mains, setMains] = useState<Main[]>([]);
    const [probiotics, setProbiotics] = useState<Probiotic[]>([]);
    const [fruits, setFruits] = useState<Fruit[]>([]);
    const [addOns, setAddOns] = useState<AddOn[]>([]);
    const [drinks, setDrinks] = useState<Drink[]>([]);

    useEffect(() => {
        const fetchItemsAndCheckAdmin = async () => {
          try {
            const user = await getCurrentUser();
            if (!user) {
              toast.error('User not authenticated');
              return;
            }
    
            const adminStatus = user.isAdmin;
            setIsAdmin(adminStatus);
    
            const mainItems = await getMains();
            if (mainItems.success && mainItems.data) {
              setMains(mainItems.data);
            } else {
              toast.error(mainItems.error || 'Failed to fetch main items');
            }
    
            const probioticItems = await getProbiotics();
            if (probioticItems.success && probioticItems.data) {
              setProbiotics(probioticItems.data);
            } else {
              toast.error(probioticItems.error || 'Failed to fetch probiotic items');
            }
    
            const fruitItems = await getFruits();
            if (fruitItems.success && fruitItems.data) {
              setFruits(fruitItems.data);
            } else {
              toast.error(fruitItems.error || 'Failed to fetch fruit items');
            }
    
            const drinkItems = await getDrinks();
            if (drinkItems.success && drinkItems.data) {
              setDrinks(drinkItems.data);
            } else {
              toast.error(drinkItems.error || 'Failed to fetch drink items');
            }
    
            const addOnItems = await getAddOns();
            if (addOnItems.success && addOnItems.data) {
              setAddOns(addOnItems.data);
            } else {
              toast.error(addOnItems.error || 'Failed to fetch add-on items');
            }
    
          } catch (error) {
            toast.error((error as Error).message);
          }
        };
    
        fetchItemsAndCheckAdmin();
    }, []);

    useEffect(() => {
        if (selectedType.value === 'all') {
            setFilteredItems([...mains, ...probiotics, ...fruits, ...drinks, ...addOns]);
        } else {
            switch (selectedType.value) {
                case 'main':
                    setFilteredItems(mains);
                    break;
                case 'probiotic':
                    setFilteredItems(probiotics);
                    break;
                case 'fruit':
                    setFilteredItems(fruits);
                    break;
                case 'drink':
                    setFilteredItems(drinks);
                    break;
                case 'addon':
                    setFilteredItems(addOns);
                    break;
                default:
                    setFilteredItems([]);
            }
        }
    }, [selectedType, mains, probiotics, fruits, drinks, addOns]);

    const handleTypeChange = (selectedOption: any) => {
        setSelectedType(selectedOption);
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

    const getItemType = (item: Main | Probiotic | Fruit | Drink | AddOn): 'main' | 'probiotic' | 'fruit' | 'drink' | 'addon' => {
        if (isMain(item)) return 'main';
        if (isProbiotic(item)) return 'probiotic';
        if (isFruit(item)) return 'fruit';
        if (isDrink(item)) return 'drink';
        if (isAddOn(item)) return 'addon';
        throw new Error('Unknown item type');
    };

    const handleSubmitItem = async (item: MenuItem, imageFile: File | null) => {
        try {
            let imageUrl = '';
            if (imageFile && (isMain(item) || isDrink(item))) {
                imageUrl = await uploadImage(imageFile);
                item.image = imageUrl;
            }

            const response = await addOrUpdateItem(item);

            if (response.success) {
                toast.success(`Item ${modalMode === 'add' ? 'added' : 'updated'} successfully`);
                setIsItemModalOpen(false);
            } else {
                toast.error(response.error || `Failed to ${modalMode} item`);
            }
        } catch (error) {
            toast.error((error as Error).message);
        }
    };

    function getCollectionName(item: MenuItem): string {
        if (item instanceof Main) return 'mains';
        if (item instanceof Probiotic) return 'probiotics';
        if (item instanceof Fruit) return 'fruits';
        if (item instanceof Drink) return 'drinks';
        if (item instanceof AddOn) return 'addon';
        throw new Error('Invalid item type');
    }

    const addOrUpdateItem = async (item: MenuItem): Promise<{ success: boolean; data?: MenuItem; error?: string}> => {
        try {
            const collectionName = getCollectionName(item);
            const itemRef = doc(db, collectionName, item.id);
            
            // Check if the document already exists
            const docSnap = await getDoc(itemRef);
            
            const itemData: any = { ...item };
            delete itemData.id;
    
            if (docSnap.exists()) {
                // Document exists, update it
                await updateDoc(itemRef, itemData);
            } else {
                // Document doesn't exist, create a new one
                await setDoc(itemRef, itemData);
            }
    
            dispatch({ type: docSnap.exists() ? 'UPDATE_MENU_ITEM' : 'ADD_MENU_ITEM', payload: item });
            return { success: true, data: item };
        } catch (error) {
            console.error('Error adding/updating item: ', error);
            return { success: false, error: (error as Error).message };
        }
    }

    const handleEdit = (item: Main | Probiotic | Fruit | Drink | AddOn) => {
        setCurrentItem(item);
        setSelectedItemType(getItemType(item));
        setModalMode('edit');
        setIsItemModalOpen(true);
    }

    const handleAdd = () => {
        setCurrentItem(null);
        setSelectedItemType(null);
        setModalMode('add');
        setIsItemModalOpen(true);
    }

    function isMain(item: any): item is Main {
        return item instanceof Main;
    }
    
    function isProbiotic(item: any): item is Probiotic {
        return item instanceof Probiotic;
    }
    
    function isFruit(item: any): item is Fruit {
        return item instanceof Fruit;
    }
    
    function isDrink(item: any): item is Drink {
        return item instanceof Drink;
    }
    
    function isAddOn(item: any): item is AddOn {
        return item instanceof AddOn;
    }

    const renderColumnHeader = (column: string) => {
        const headerText = column.charAt(0).toUpperCase() + column.slice(1);
        let className = "px-4 py-2 text-left font-normal";
        switch (column) {
            case 'image':
                className += " w-32";
                break;
            case 'name':
                className += " w-full";
                break;
            case 'type':
            case 'price':
                className += " w-32";
                break;
            case 'allergens':
                className += " w-42";
                break;
        }
        return <th key={column} className={className}>{headerText === 'Image' ? '' : headerText}</th>;
    };

    const renderCell = (item: Main | Probiotic | Fruit | Drink | AddOn, column: string) => {
        const baseClassName = "px-4 py-2 h-20 max-h-20 overflow-hidden";
        switch (column) {
            case 'image':
            return (
                <td key={`${item.id}-${column}`} className={`${baseClassName} flex w-20 h-20`}>
                    {(isMain(item) || isDrink(item)) && 'image' in item && item.image && (
                        <div className="w-full h-full flex items-center justify-center">
                            <img 
                                src={item.image} 
                                alt={item.display} 
                                className="max-w-full max-h-full object-contain rounded-md shadow "
                            />
                        </div>
                    )}
                </td>
            );
            case 'name':
                return <td key={`${item.id}-${column}`} className={`${baseClassName} w-full truncate`}>{item.display}</td>;
            case 'type':
                return (
                    <td key={`${item.id}-${column}`} className={`${baseClassName} w-32 truncate`}>
                        {isMain(item) ? 'Main' :
                         isProbiotic(item) ? 'Probiotic' :
                         isFruit(item) ? 'Fruit' :
                         isDrink(item) ? 'Drink' :
                         isAddOn(item) ? 'Add On' : ''}
                    </td>
                );
            case 'price':
                return (
                    <td key={`${item.id}-${column}`} className={`${baseClassName} w-32 truncate`}>
                        {(isMain(item) || isDrink(item) || isAddOn(item)) && item.price ? 
                            `$${item.price}` : 'N/A'}
                    </td>
                );
            case 'allergens':
                return (
                    <td key={`${item.id}-${column}`} className={`${baseClassName} w-42 truncate`}>
                        {isMain(item) ? item.allergens?.join(', ') || 'None' : 'N/A'}
                    </td>
                );
            default:
                return <td key={`${item.id}-${column}`} className={baseClassName}>N/A</td>;
        }
    };

    if (!isAdmin) {
        return <div>You do not have permission to access this page.</div>;
    }

    const columns = columnConfigs[selectedType.value as keyof typeof columnConfigs];

    return (
        <div className="w-full px-4">
            <div className="w-full flex flex-col justify-start items-center md:flex-row md:justify-between gap-4 pb-4">
                <h1 className='text-3xl'>
                    Menu Items
                </h1>
                <div className='w-fit flex flex-col justify-center items-center md:flex-row md:justify-end md:items-center gap-2'>
                    <Select
                        options={itemTypeOptions}
                        value={selectedType}
                        onChange={handleTypeChange}
                        className="w-48"
                    />
                    <button
                        onClick={() => handleAdd()}
                        className="flex justify-center items-center gap-2 text-sm rounded-md py-2 px-4 bg-brand-dark-green text-brand-cream hover:brightness-75 hover:ring-2 ring-offset-2 w-full sm:w-auto"
                    >
                        <PlusIcon className="h-5 w-5" />
                        <span className='whitespace-nowrap'>Add New Item</span>
                    </button>
                </div>         
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-gray-100">
                        <tr>
                            {columns.map(renderColumnHeader)}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map(item => (
                            <tr 
                                key={item.id} 
                                className="border-b hover:bg-gray-50 cursor-pointer"
                                onClick={() => handleEdit(item)}
                            >
                                {columns.map(column => renderCell(item, column))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ItemModal
                isOpen={isItemModalOpen}
                onClose={() => setIsItemModalOpen(false)}
                onSubmit={handleSubmitItem}
                item={currentItem}
                mode={modalMode}
                itemType={selectedItemType}
            />

        </div>
    );
}

export default ItemController;