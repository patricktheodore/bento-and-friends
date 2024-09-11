import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { Main, Probiotic, Fruit, Drink, AddOn } from '../models/item.model';

interface ItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (item: Main | Probiotic | Fruit | Drink | AddOn, imageFile: File | null) => Promise<void>;
    item: Main | Probiotic | Fruit | Drink | AddOn | null;
    mode: 'add' | 'edit';
    itemType: 'main' | 'probiotic' | 'fruit' | 'drink' | 'addon' | null;
}

type FormData = Partial<Main & Probiotic & Fruit & Drink & AddOn>;
type ItemType = 'main' | 'probiotic' | 'fruit' | 'drink' | 'addon';

const allergenOptions: { value: string; label: string }[] = [
    { value: 'dairy', label: 'Dairy' },
    { value: 'nuts', label: 'Nuts' },
    { value: 'gluten', label: 'Gluten' },
    { value: 'soy', label: 'Soy' },
    { value: 'eggs', label: 'Eggs' },
];



const ItemModal: React.FC<ItemModalProps> = ({ isOpen, onClose, onSubmit, item, mode, itemType }) => {
    const [selectedType, setSelectedType] = useState<ItemType | null>(itemType);
    const [formData, setFormData] = useState<FormData>({});
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && item) {
                setFormData({ ...item });
                setSelectedType(getItemType(item));
                if (item instanceof Main || item instanceof Drink) {
                    setImagePreviewUrl(item.image || null);
                }
            } else {
                setFormData({});
                setSelectedType(null);
                setSelectedImage(null);
            }
        } else {
            setSelectedType(null);
            setFormData({});
            setSelectedImage(null);
            setImagePreviewUrl(null);
        }
    }, [isOpen, mode, item]);

    const getItemType = (item: Main | Probiotic | Fruit | Drink | AddOn): ItemType => {
        if (item instanceof Main) return 'main';
        if (item instanceof Probiotic) return 'probiotic';
        if (item instanceof Fruit) return 'fruit';
        if (item instanceof Drink) return 'drink';
        if (item instanceof AddOn) return 'addon';
        throw new Error('Unknown item type');
    };

    const handleClose = () => {
        setSelectedType(null);
        setFormData({});
        setSelectedImage(null);
        setImagePreviewUrl(null);
        onClose();
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            setImagePreviewUrl(URL.createObjectURL(file));
            setFormData(prev => ({ ...prev, image: file.name }));
        }
    };

    const handleClearImage = () => {
        setSelectedImage(null);
        setImagePreviewUrl(null);
        setFormData(prev => ({ ...prev, image: '' }));
    };

    const handleSelectChange = (
        selectedOptions: readonly { value: string; label: string }[],
        actionMeta: { name?: string }
    ) => {
        if (actionMeta.name && actionMeta.name in formData) {
            const selectedValues = selectedOptions.map(option => option.value);
            setFormData(prev => ({
                ...prev,
                [actionMeta.name as string]: selectedValues
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedType) return;
    
        let submittedItem: Main | Probiotic | Fruit | Drink | AddOn;
        const existingId = mode === 'edit' && item ? item.id : undefined;
    
        switch (selectedType) {
            case 'main':
                submittedItem = new Main(
                    formData.display,
                    formData.image,
                    formData.description,
                    formData.allergens,
                    formData.isNew,
                    formData.isActive,
                    formData.isFeatured,
                    formData.isVegetarian,
                    formData.addOns,
                    formData.price,
                    existingId
                );
                break;
            case 'probiotic':
                submittedItem = new Probiotic(formData.display, existingId);
                break;
            case 'fruit':
                submittedItem = new Fruit(formData.display, existingId);
                break;
            case 'drink':
                submittedItem = new Drink(formData.display, formData.image, formData.price, existingId);
                break;
            case 'addon':
                submittedItem = new AddOn(formData.display, formData.price, existingId);
                break;
            default:
                throw new Error(`Invalid itemType: ${selectedType}`);
        }
        await onSubmit(submittedItem, selectedImage);
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl mb-4">{mode === 'add' ? 'Add New Item' : 'Edit Item'}{selectedType ? ` - ${selectedType}` : ''}</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {mode === 'add' && !selectedType && (
                        <div>
                            <label htmlFor="itemType" className="block text-sm font-medium text-gray-700 mb-1">
                                Select Item Type
                            </label>
                            <Select
                                id="itemType"
                                options={[
                                    { value: 'main', label: 'Main' },
                                    { value: 'probiotic', label: 'Probiotic' },
                                    { value: 'fruit', label: 'Fruit' },
                                    { value: 'drink', label: 'Drink' },
                                    { value: 'addon', label: 'Add-On' },
                                ]}
                                onChange={(selected) => {
                                    if (selected) {
                                        setSelectedType(selected.value as ItemType);
                                        setFormData({});
                                    }
                                }}
                            />
                        </div>
                    )}

                    {(mode === 'edit' || selectedType) && (
                        <>
                            <div>
                                <label htmlFor="display" className="block text-sm font-medium text-gray-700 mb-1">
                                    Item Name
                                </label>
                                <input
                                    type="text"
                                    id="display"
                                    name="display"
                                    value={formData.display || ''}
                                    onChange={handleInputChange}
                                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-dark-green focus:border-brand-dark-green"
                                    required
                                />
                            </div>

                            {(selectedType === 'main' || selectedType === 'drink') && (
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
                                    {imagePreviewUrl && (
                                        <div className="mt-2">
                                            <img src={imagePreviewUrl} alt="Preview" className="max-w-full h-auto max-h-40 object-contain" />
                                            <button
                                                type="button"
                                                onClick={handleClearImage}
                                                className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm"
                                            >
                                                Clear Image
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {(selectedType === 'main' || selectedType === 'drink' || selectedType === 'addon') && (
                                <div>
                                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                                        Price
                                    </label>
                                    <input
                                        type="number"
                                        id="price"
                                        name="price"
                                        value={formData.price || ''}
                                        onChange={handleInputChange}
                                        className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-dark-green focus:border-brand-dark-green"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                            )}

                            {selectedType === 'main' && (
                                <>
                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            value={formData.description || ''}
                                            onChange={handleInputChange}
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
                                            value={allergenOptions.filter(option => formData.allergens?.includes(option.value))}
                                            onChange={handleSelectChange}
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                        />
                                    </div>
                                    <ToggleSwitch
                                        id="isNew"
                                        checked={formData.isNew || false}
                                        onChange={handleInputChange}
                                        label="New Item"
                                    />
                                    <ToggleSwitch
                                        id="isActive"
                                        checked={formData.isActive || false}
                                        onChange={handleInputChange}
                                        label="Active"
                                    />
                                    <ToggleSwitch
                                        id="isFeatured"
                                        checked={formData.isFeatured || false}
                                        onChange={handleInputChange}
                                        label="Featured"
                                    />
                                    <ToggleSwitch
                                        id="isVegetarian"
                                        checked={formData.isVegetarian || false}
                                        onChange={handleInputChange}
                                        label="Vegetarian"
                                    />
                                </>
                            )}
                        </>
                    )}

                    <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 bg-gray-200 rounded w-full sm:w-auto"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-brand-dark-green text-white rounded w-full sm:w-auto"
                            disabled={mode === 'add' && !selectedType}
                        >
                            {mode === 'add' ? 'Add' : 'Update'} Item
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ItemModal;