import React, { useState, useEffect } from 'react';
import { Main } from '../models/item.model';
import { useAppContext } from '../context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { X } from 'lucide-react';

interface MainItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (item: Main, imageFile: File | null) => Promise<void>;
    item: Main | null;
    mode: 'add' | 'edit';
}

const MainItemModal: React.FC<MainItemModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    item,
    mode
}) => {
    const { state } = useAppContext();
    const [formData, setFormData] = useState({
        display: '',
        description: '',
        price: 0,
        allergens: [] as string[],
        addOns: [] as string[],
        isActive: true,
        isNew: false,
        isFeatured: false,
        isVegetarian: false,
        isPromo: false,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [allergenInput, setAllergenInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get available addons from app context
    const availableAddons = state.addOns.filter(addon => addon.isActive);

    useEffect(() => {
        if (item && mode === 'edit') {
            setFormData({
                display: item.display || '',
                description: item.description || '',
                price: item.price || 0,
                allergens: item.allergens || [],
                addOns: item.addOns || [],
                isActive: item.isActive ?? true,
                isNew: item.isNew ?? false,
                isFeatured: item.isFeatured ?? false,
                isVegetarian: item.isVegetarian ?? false,
                isPromo: item.isPromo ?? false,
            });
            setImagePreview(item.image || '');
        } else {
            // Reset form for add mode
            setFormData({
                display: '',
                description: '',
                price: 0,
                allergens: [],
                addOns: [],
                isActive: true,
                isNew: false,
                isFeatured: false,
                isVegetarian: false,
                isPromo: false,
            });
            setImagePreview('');
            setImageFile(null);
        }
        setAllergenInput('');
    }, [item, mode, isOpen]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddAllergen = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && allergenInput.trim()) {
            e.preventDefault();
            if (!formData.allergens.includes(allergenInput.trim())) {
                setFormData({
                    ...formData,
                    allergens: [...formData.allergens, allergenInput.trim()]
                });
            }
            setAllergenInput('');
        }
    };

    const handleRemoveAllergen = (allergen: string) => {
        setFormData({
            ...formData,
            allergens: formData.allergens.filter(a => a !== allergen)
        });
    };

    const handleAddonToggle = (addonId: string) => {
        setFormData(prev => {
            const currentAddons = prev.addOns;
            const updatedAddons = currentAddons.includes(addonId)
                ? currentAddons.filter(id => id !== addonId)
                : [...currentAddons, addonId];
            
            return {
                ...prev,
                addOns: updatedAddons
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.display || formData.price < 0) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        
        try {
            const mainItem = new Main(
                formData.display,
                imagePreview,
                formData.description,
                formData.allergens,
                formData.isNew,
                formData.isActive,
                formData.isFeatured,
                formData.isVegetarian,
                formData.addOns,
                formData.price,
                item?.id,
                formData.isPromo
            );

            await onSubmit(mainItem, imageFile);
            onClose();
        } catch (error) {
            console.error('Error submitting main item:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatPrice = (price: number): string => {
        return price < 0 ? `-$${Math.abs(price).toFixed(2)}` : `$${price.toFixed(2)}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'add' ? 'Add New Main Item' : 'Edit Main Item'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="display">Name *</Label>
                            <Input
                                id="display"
                                value={formData.display}
                                onChange={(e) => setFormData({ ...formData, display: e.target.value })}
                                placeholder="Enter item name"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Enter item description"
                                rows={3}
                            />
                        </div>

                        <div>
                            <Label htmlFor="price">Price *</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                required
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Current: {formatPrice(formData.price)}
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="image">Image</Label>
                            <Input
                                id="image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                            {imagePreview && (
                                <div className="mt-2 w-32 h-32 border rounded-lg overflow-hidden">
                                    <img 
                                        src={imagePreview} 
                                        alt="Preview" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Allergens */}
                    <div>
                        <Label htmlFor="allergens">Allergens</Label>
                        <Input
                            id="allergens"
                            value={allergenInput}
                            onChange={(e) => setAllergenInput(e.target.value)}
                            onKeyDown={handleAddAllergen}
                            placeholder="Type allergen and press Enter"
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                            {formData.allergens.map((allergen) => (
                                <Badge key={allergen} variant="secondary" className="flex items-center gap-1">
                                    {allergen}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveAllergen(allergen)}
                                        className="ml-1 hover:text-red-500"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Add-ons Selection */}
                    <div>
                        <h4 className="text-md font-semibold mb-3">Available Add-ons</h4>
                        <p className="text-sm text-gray-600 mb-4">
                            Select add-ons that can be added to this main item:
                        </p>
                        
                        <div className="space-y-4">
                            {/* Add-ons Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-1">
                                {availableAddons.map((addon) => (
                                    <div
                                        key={addon.id}
                                        className="flex items-start space-x-3 p-3 border rounded-lg bg-white hover:bg-gray-50"
                                    >
                                        <input
                                            type="checkbox"
                                            id={`addon-${addon.id}`}
                                            checked={formData.addOns.includes(addon.id)}
                                            onChange={() => handleAddonToggle(addon.id)}
                                            className="mt-1 h-4 w-4 text-brand-dark-green accent-brand-dark-green focus:ring-brand-dark-green border-gray-300 rounded"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <label
                                                htmlFor={`addon-${addon.id}`}
                                                className="text-sm font-medium text-gray-900 cursor-pointer"
                                            >
                                                {addon.display}
                                            </label>
                                            {addon.price && (
                                                <p className="text-xs text-green-600 font-medium mt-1">
                                                    {formatPrice(addon.price)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Selected add-ons summary */}
                            {formData.addOns.length > 0 && (
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="text-sm font-medium text-blue-900 mb-2">
                                        Selected Add-ons: {formData.addOns.length}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {formData.addOns.map(addonId => {
                                            const addon = availableAddons.find(a => a.id === addonId);
                                            return addon ? (
                                                <span
                                                    key={addonId}
                                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                >
                                                    {addon.display}
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="isActive">Active</Label>
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="isNew">New Item</Label>
                            <Switch
                                id="isNew"
                                checked={formData.isNew}
                                onCheckedChange={(checked) => setFormData({ ...formData, isNew: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="isFeatured">Featured</Label>
                            <Switch
                                id="isFeatured"
                                checked={formData.isFeatured}
                                onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="isVegetarian">Vegetarian</Label>
                            <Switch
                                id="isVegetarian"
                                checked={formData.isVegetarian}
                                onCheckedChange={(checked) => setFormData({ ...formData, isVegetarian: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="isPromo">Promotional Item</Label>
                            <Switch
                                id="isPromo"
                                checked={formData.isPromo}
                                onCheckedChange={(checked) => setFormData({ ...formData, isPromo: checked })}
                            />
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-brand-dark-green text-brand-cream"
                        >
                            {isSubmitting ? 'Saving...' : mode === 'add' ? 'Add Item' : 'Update Item'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default MainItemModal;