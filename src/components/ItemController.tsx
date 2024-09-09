import React, { useState, useEffect } from 'react';
import { PencilIcon, PlusIcon } from '@heroicons/react/16/solid';
import { getCurrentUser } from '../services/auth';
import { getMains } from '../services/item-service';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { AddOn, Fruit, Main, Probiotic } from '../models/item.model';
import { doc, setDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

interface ItemTypeOption {
    value: string;
    label: string;
}

const itemTypeOptions: ItemTypeOption[] = [
    { value: 'main', label: 'Main' },
    { value: 'yogurt', label: 'Pro-biotic' },
    { value: 'fruit', label: 'Fruit' },
    { value: 'addon', label: 'Add On' },
];

const allergenOptions: ItemTypeOption[] = [
    { value: 'dairy', label: 'Dairy' },
    { value: 'nuts', label: 'Nuts' },
    { value: 'gluten', label: 'Gluten' },
    { value: 'soy', label: 'Soy' },
    { value: 'eggs', label: 'Eggs' },
];

const ItemController: React.FC = () => {
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [mains, setMains] = useState<Main[]>([]);
    const [probiotics, setProbiotics] = useState<Probiotic[]>([]);
    const [fruits, setFruits] = useState<Fruit[]>([]);
    const [addOns, setAddOns] = useState<AddOn[]>([]);
    const [newItem, setNewItem] = useState<Main>(new Main());
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    

    // Function to add or update an item
    // const addOrUpdateMian = async (main: Main): Promise<{ success: boolean; data?: Main; error?: string }> => {
    //     try {
    //         const itemRef = doc(db, 'mains', main.id);
    //         await setDoc(
    //             itemRef,
    //             {
    //                 display: main.display,
    //                 image: main.image,
    //                 allergens: main.allergens,
    //                 isNew: main.isNew,
    //                 isActive: main.isActive,
    //                 isFeatured: main.isFeatured,
    //                 isVegetarian: main.isVegetarian,
    //                 addOns: main.addOns,
    //             },
    //             { merge: true }
    //         );

    //         return { success: true, data: main };
    //     } catch (error) {
    //         console.error('Error adding/updating main: ', error);
    //         return { success: false, error: (error as Error).message };
    //     }
    // };

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

                const response = await getMains();
                if (response.success && response.data) {
                    setMains(response.data);
                } else {
                    toast.error(response.error || 'Failed to fetch items');
                }
            } catch (error) {
                toast.error((error as Error).message);
            }
        };

        fetchItemsAndCheckAdmin();
    }, []);

    const uploadImage = async (file: File): Promise<string> => {
        const fileId = uuidv4();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${fileId}.${fileExtension}`;
        const storageRef = ref(storage, `main-images/${fileName}`);
        
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const inputValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setNewItem((prev) => ({ ...prev, [name]: inputValue }));
    };

    const handleSelectChange = (selectedOptions: readonly ItemTypeOption[], actionMeta: { name?: string }) => {
        if (actionMeta.name) {
            const selectedValues = selectedOptions.map((option) => option.value);
            // setNewItem((prev) => ({ ...prev, [actionMeta.name]: selectedValues }));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedImage(e.target.files[0]);
        }
    };

    const addNewMain = async (main: Main): Promise<{ success: boolean; data?: Main; error?: string }> => {
        try {
            const mainRef = doc(db, 'mains', main.id);
            await setDoc(mainRef, {
                display: main.display,
                image: main.image, // This now contains the image URL
                allergens: main.allergens,
                isNew: main.isNew,
                isActive: main.isActive,
                isFeatured: main.isFeatured,
                isVegetarian: main.isVegetarian,
                addOns: main.addOns,
            });

            return { success: true, data: main };
        } catch (error) {
            console.error('Error adding main: ', error);
            return { success: false, error: (error as Error).message };
        }
    };

    const handleSubmitItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAdmin) {
            toast.error('Only admins can manage menu items');
            return;
        }

        try {
            let imageUrl = '';
            if (selectedImage) {
                imageUrl = await uploadImage(selectedImage);
            }

            const newMain = new Main(
                newItem.display,
                imageUrl, // Pass the image URL here
                newItem.allergens || [],
                newItem.isNew || false,
                newItem.isActive || true,
                newItem.isFeatured || false,
                newItem.isVegetarian || false,
                []  // AddOns will be empty for now
            );

            const response = await addNewMain(newMain);
            if (response.success && response.data) {
                setIsItemModalOpen(false);
                setNewItem(new Main());
                setSelectedImage(null);
                toast.success('Main item added successfully');
                // Refresh the list of mains
                const mainsResponse = await getMains();
                if (mainsResponse.success && mainsResponse.data) {
                    setMains(mainsResponse.data);
                }
            } else {
                toast.error(response.error || 'Failed to add main item');
            }
        } catch (error) {
            toast.error((error as Error).message);
        }
    };

    const ToggleSwitch: React.FC<{
        id: string;
        checked: boolean;
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        label: string;
    }> = ({ id, checked, onChange, label }) => {
        return (
            <div className="flex items-center">
                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input
                        type="checkbox"
                        name={id}
                        id={id}
                        checked={checked}
                        onChange={onChange}
                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    />
                    <label
                        htmlFor={id}
                        className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                    ></label>
                </div>
                <label
                    htmlFor={id}
                    className="text-sm text-gray-700"
                >
                    {label}
                </label>
            </div>
        );
    };

    return (
        <div className="w-full px-4">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <h2 className="w-full text-left text-2xl font-bold mb-2 sm:mb-0">Menu Items</h2>
                <button
                    onClick={() => {
                        // setEditingItem(null);
                        setNewItem(new Main());
                        setIsItemModalOpen(true);
                    }}
                    className="flex justify-center items-center gap-2 text-sm rounded-md py-2 px-4 bg-brand-dark-green text-brand-cream hover:brightness-75 hover:ring-2 ring-offset-2 w-full sm:w-auto"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span className='whitespace-nowrap'>Add New Item</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mains.map((item) => (
                    <div
                        key={item.id}
                        className="bg-stone-100 shadow-lg rounded-lg p-4 relative"
                    >
                        {item.image && (
                            <img 
                                src={item.image} 
                                alt={item.display} 
                                className="w-full h-48 object-cover mb-4 rounded"
                            />
                        )}
                        <button
                            className="absolute gap-2 top-4 right-4 text-brand-gold hover:brightness-75 flex items-center"
                            aria-label="Edit item"
                        >
                            <PencilIcon className="h-5 w-5" />
                            Edit
                        </button>
                        <h3 className="font-bold text-lg mb-2 pr-8">
                            {item.display}
                            {item.isNew && <span className="ml-2 text-xs bg-yellow-400 text-yellow-800 px-2 py-1 rounded-full">New</span>}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">Type: Main</p>
                        <p className="text-sm text-gray-500 mb-2">Allergens: {item.allergens?.join(', ')}</p>
                        <div className="flex flex-wrap gap-2">
                            {item.isVegetarian && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Vegetarian</span>}
                            {item.isFeatured && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Featured</span>}
                            {!item.isActive && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Inactive</span>}
                        </div>
                    </div>
                ))}
            </div>

            {isItemModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-xl mb-4">Add New Main Item</h2>
                        <form onSubmit={handleSubmitItem} className="flex flex-col gap-4">
                            <div>
                                <label htmlFor="display" className="block text-sm font-medium text-gray-700 mb-1">
                                    Item Name
                                </label>
                                <input
                                    type="text"
                                    id="display"
                                    name="display"
                                    placeholder="Cheeseburger"
                                    value={newItem.display}
                                    onChange={handleInputChange}
                                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-dark-green focus:border-brand-dark-green"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                                    Image
                                </label>
                                <input
                                    type="file"
                                    id="image"
                                    name="image"
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-dark-green focus:border-brand-dark-green"
                                />
                            </div>
                            <div>
                                <label htmlFor="allergens" className="block text-sm font-medium text-gray-700 mb-1">
                                    Allergens
                                </label>
                                <Select
                                    isMulti
                                    id="allergens"
                                    name="allergens"
                                    options={allergenOptions}
                                    value={allergenOptions.filter(option => newItem.allergens?.includes(option.value))}
                                    onChange={(selectedOptions) => handleSelectChange(selectedOptions, { name: 'allergens' })}
                                    className="basic-multi-select"
                                    classNamePrefix="select"
                                />
                            </div>
                            <ToggleSwitch
                                id="isNew"
                                checked={newItem.isNew || false}
                                onChange={handleInputChange}
                                label="New Item"
                            />
                            <ToggleSwitch
                                id="isActive"
                                checked={newItem.isActive || false}
                                onChange={handleInputChange}
                                label="Active"
                            />
                            <ToggleSwitch
                                id="isFeatured"
                                checked={newItem.isFeatured || false}
                                onChange={handleInputChange}
                                label="Featured"
                            />
                            <ToggleSwitch
                                id="isVegetarian"
                                checked={newItem.isVegetarian || false}
                                onChange={handleInputChange}
                                label="Vegetarian"
                            />
                            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsItemModalOpen(false);
                                        setNewItem(new Main('', '', [], false, true, false, false, []));
                                        setSelectedImage(null);
                                    }}
                                    className="px-4 py-2 bg-gray-200 rounded w-full sm:w-auto"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-brand-dark-green text-white rounded w-full sm:w-auto"
                                >
                                    Add Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default ItemController;