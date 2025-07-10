import React, { useEffect, useState } from 'react';
import { Side, Fruit, Drink, AddOn, Platter } from '../models/item.model';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { DialogFooter, DialogHeader } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { Loader2 } from 'lucide-react';

interface ItemModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (item: Side | Fruit | Drink | AddOn | Platter, imageFile: File | null) => Promise<void>;
	item: Side | Fruit | Drink | AddOn | Platter | null;
	mode: 'add' | 'edit';
	itemType: 'side' | 'fruit' | 'drink' | 'addon' | 'platter' | null;
}

type ItemType = 'side' | 'fruit' | 'drink' | 'addon' | 'platter';

// Define a more specific form data type
interface FormData {
	display: string;
	code: string;
	price: number;
	description: string;
	image?: string;
	isActive: boolean;
}

const ItemModal: React.FC<ItemModalProps> = ({ isOpen, onClose, onSubmit, item, mode, itemType }) => {
	const [formData, setFormData] = useState<FormData>({
		display: '',
		code: '',
		price: 0,
		description: '',
		isActive: true,
	});
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Use the passed itemType directly
	const currentItemType = itemType;

	// Cleanup blob URLs on unmount
	useEffect(() => {
		return () => {
			if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
				URL.revokeObjectURL(imagePreviewUrl);
			}
		};
	}, [imagePreviewUrl]);

	useEffect(() => {
		if (isOpen) {
			if (mode === 'edit' && item) {
				// Extract the common properties from the item
				const baseData: FormData = {
					display: item.display || '',
					code: '',
					price: 0,
					description: '',
					isActive: item.isActive ?? true,
				};

				// Add type-specific properties
				if (item instanceof Side || item instanceof Fruit) {
					baseData.code = item.code || '';
				}
				if (item instanceof Drink || item instanceof AddOn || item instanceof Platter) {
					baseData.price = item.price || 0;
				}
				if (item instanceof Platter) {
					baseData.description = item.description || '';
				}
				if ((item instanceof Drink || item instanceof Platter) && item.image) {
					baseData.image = item.image;
					setImagePreviewUrl(item.image);
				} else {
					setImagePreviewUrl(null);
				}

				setFormData(baseData);
			} else {
				// Reset form for add mode
				setFormData({
					display: '',
					price: 0,
					code: '',
					description: '',
					isActive: true,
				});
				setSelectedImage(null);
				setImagePreviewUrl(null);
			}
		}
	}, [isOpen, mode, item]);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			setSelectedImage(file);
			setImagePreviewUrl(URL.createObjectURL(file));
		}
	};

	const handleClearImage = () => {
		setSelectedImage(null);
		setImagePreviewUrl(null);
		if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
			URL.revokeObjectURL(imagePreviewUrl);
		}
	};

	const handleInputChange = (name: keyof FormData, value: string | number | boolean) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!currentItemType) return;

		setIsLoading(true);

		try {
			let submittedItem: Side | Fruit | Drink | AddOn | Platter;
			const existingId = mode === 'edit' && item ? item.id : undefined;
			
			switch (currentItemType) {
				case 'side':
					submittedItem = new Side(
						formData.display,
						existingId,
						formData.code || undefined,
						formData.isActive
					);
					break;
				case 'fruit':
					submittedItem = new Fruit(
						formData.display,
						existingId,
						formData.code || undefined,
						formData.isActive
					);
					break;
				case 'drink':
					submittedItem = new Drink(
						formData.display,
						imagePreviewUrl || formData.image,
						formData.price,
						existingId,
						formData.isActive
					);
					break;
				case 'addon':
					submittedItem = new AddOn(
						formData.display,
						formData.price,
						existingId,
						formData.isActive
					);
					break;
				case 'platter':
					submittedItem = new Platter(
						formData.display,
						imagePreviewUrl || formData.image,
						formData.description || undefined,
						formData.price,
						existingId,
						formData.isActive,
					);
					break;
				default:
					throw new Error(`Invalid itemType: ${currentItemType}`);
			}
			
			await onSubmit(submittedItem, selectedImage);
			onClose();
		} catch (error) {
			console.error('Error submitting item:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const formatPrice = (price: number): string => {
		return price < 0 ? `-$${Math.abs(price).toFixed(2)}` : `$${price.toFixed(2)}`;
	};

	const getItemTypeDisplay = (type: ItemType | null): string => {
		if (!type) return '';
		const typeMap: Record<ItemType, string> = {
			side: 'Side',
			fruit: 'Fruit',
			drink: 'Drink',
			addon: 'Add-On',
			platter: 'Platter'
		};
		return typeMap[type] || type;
	};

	if (!isOpen || !currentItemType) return null;

	const showImage = currentItemType === 'drink' || currentItemType === 'platter';
	const showPrice = currentItemType === 'drink' || currentItemType === 'addon' || currentItemType === 'platter';
	const showDescription = currentItemType === 'platter';
	const showCode = currentItemType === 'side' || currentItemType === 'fruit';

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open && !isLoading) {
					if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
						URL.revokeObjectURL(imagePreviewUrl);
					}
					onClose();
				}
			}}
		>
			<DialogContent
				className={`max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto ${
					isLoading ? 'opacity-75 pointer-events-none' : ''
				}`}
			>
				<DialogHeader>
					<DialogTitle>
						{mode === 'add' ? 'Add New' : 'Edit'} {getItemTypeDisplay(currentItemType)}
					</DialogTitle>
					<DialogDescription>
						{mode === 'add' 
							? `Add a new ${getItemTypeDisplay(currentItemType).toLowerCase()} to the menu.` 
							: `Edit the ${getItemTypeDisplay(currentItemType).toLowerCase()} details.`}
					</DialogDescription>
				</DialogHeader>
				
				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Name field - always shown */}
					<div className="space-y-2">
						<Label htmlFor="display">Name *</Label>
						<Input
							id="display"
							value={formData.display || ''}
															onChange={(e) => handleInputChange('display', e.target.value)}
							placeholder={`Enter ${getItemTypeDisplay(currentItemType).toLowerCase()} name`}
							required
						/>
					</div>

					{/* Code field - for sides and fruits */}
					{showCode && (
						<div className="space-y-2">
							<Label htmlFor="code">Code</Label>
							<Input
								id="code"
								type="text"
								value={formData.code || ''}
								onChange={(e) => handleInputChange('code', e.target.value)}
								placeholder="Enter item code (optional)"
							/>
						</div>
					)}

					{/* Price field - for drinks, addons, and platters */}
					{showPrice && (
						<div className="space-y-2">
							<Label htmlFor="price">Price *</Label>
							<Input
								id="price"
								type="number"
								value={formData.price}
								onChange={(e) => {
									const value = e.target.value;
									handleInputChange('price', value === '' ? 0 : parseFloat(value) || 0);
								}}
								step="0.01"
								placeholder="0.00"
								required
							/>
							<p className="text-sm text-gray-500">
								Display price: {formatPrice(formData.price)}
							</p>
						</div>
					)}

					{/* Description field - for platters only */}
					{showDescription && (
						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								value={formData.description || ''}
								onChange={(e) => handleInputChange('description', e.target.value)}
								placeholder="Enter platter description"
								rows={3}
							/>
						</div>
					)}

					{/* Image field - for drinks and platters */}
					{showImage && (
						<div className="space-y-2">
							<Label htmlFor="image">Image</Label>
							{!imagePreviewUrl && (
								<Input
									id="image"
									type="file"
									onChange={handleImageChange}
									accept="image/*"
								/>
							)}
							{imagePreviewUrl && (
								<div className="mt-2 space-y-2">
									<div className="relative inline-block">
										<img
											src={imagePreviewUrl}
											alt="Preview"
											className="max-w-full h-auto max-h-40 object-contain rounded border"
										/>
									</div>
									<Button
										type="button"
										onClick={handleClearImage}
										variant="outline"
										size="sm"
									>
										Remove Image
									</Button>
								</div>
							)}
						</div>
					)}

					{/* Active toggle - always shown */}
					<div className="flex items-center justify-between py-2">
						<div className="space-y-0.5">
							<Label htmlFor="isActive">Available</Label>
							<p className="text-sm text-gray-500">
								Item will be visible and orderable when active
							</p>
						</div>
						<Switch
							id="isActive"
							checked={formData.isActive ?? true}
							onCheckedChange={(checked) => handleInputChange('isActive', checked)}
						/>
					</div>

					<DialogFooter className="pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
									URL.revokeObjectURL(imagePreviewUrl);
								}
								onClose();
							}}
							disabled={isLoading}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isLoading || !formData.display.trim()}
							className="bg-brand-dark-green text-brand-cream"
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									{mode === 'add' ? 'Adding...' : 'Updating...'}
								</>
							) : (
								<>{mode === 'add' ? 'Add' : 'Update'} {getItemTypeDisplay(currentItemType)}</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default ItemModal;