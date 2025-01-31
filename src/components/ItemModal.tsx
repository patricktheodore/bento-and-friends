import React, { useEffect, useState } from 'react';
import { Main, Probiotic, Fruit, Drink, AddOn, Platter } from '../models/item.model';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { DialogFooter, DialogHeader } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import MultiSelect from 'react-select';
import { Loader2 } from 'lucide-react';

interface ItemModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (item: Main | Probiotic | Fruit | Drink | AddOn | Platter, imageFile: File | null) => Promise<void>;
	item: Main | Probiotic | Fruit | Drink | AddOn | Platter | null;
	mode: 'add' | 'edit';
	itemType: 'main' | 'probiotic' | 'fruit' | 'drink' | 'addon' | 'platter' | null;
}

type FormData = Partial<Main & Probiotic & Fruit & Drink & AddOn>;
type ItemType = 'main' | 'probiotic' | 'fruit' | 'drink' | 'addon' | 'platter';

const allergenOptions: { value: string; label: string }[] = [
	{ value: 'dairy', label: 'Dairy' },
	{ value: 'gluten', label: 'Gluten' },
	{ value: 'soy', label: 'Soy' },
	{ value: 'eggs', label: 'Eggs' },
];

const ItemModal: React.FC<ItemModalProps> = ({ isOpen, onClose, onSubmit, item, mode, itemType }) => {
	const [selectedType, setSelectedType] = useState<ItemType | null>(itemType);
	const [formData, setFormData] = useState<FormData>({});
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

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

	const getItemType = (item: Main | Probiotic | Fruit | Drink | AddOn | Platter): ItemType => {
		if (item instanceof Main) return 'main';
		if (item instanceof Probiotic) return 'probiotic';
		if (item instanceof Fruit) return 'fruit';
		if (item instanceof Drink) return 'drink';
		if (item instanceof AddOn) return 'addon';
		if (item instanceof Platter) return 'platter';
		throw new Error('Unknown item type');
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			setSelectedImage(file);
			setImagePreviewUrl(URL.createObjectURL(file));
			setFormData((prev) => ({ ...prev, image: file.name }));
		}
	};

	const handleClearImage = () => {
		setSelectedImage(null);
		setImagePreviewUrl(null);
		setFormData((prev) => ({ ...prev, image: '' }));
	};

	const handleInputChange = (name: string, value: string | number | boolean) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleAllergenChange = (selectedOptions: readonly { value: string; label: string }[]) => {
		const selectedAllergens = selectedOptions.map((option) => option.value);
		setFormData((prev) => ({ ...prev, allergens: selectedAllergens }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedType) return;

		setIsLoading(true);

		try {
			let submittedItem: Main | Probiotic | Fruit | Drink | AddOn | Platter;
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
				case 'platter':
					submittedItem = new Platter(
						formData.display,
						formData.image,
						formData.description,
						formData.price,
						existingId
					);
					break;
				default:
					throw new Error(`Invalid itemType: ${selectedType}`);
			}
			await onSubmit(submittedItem, selectedImage);
		} catch (error) {
			console.error('Error submitting item:', error);
			// Handle error (e.g., show error message to user)
		} finally {
			setIsLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open && !isLoading) onClose();
			}}
		>
			<DialogContent
				className={`max-w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-scroll ${
					isLoading ? 'opacity-75 pointer-events-none' : ''
				}`}
			>
				<DialogHeader className="rounded-md">
					<DialogTitle>
						{mode === 'add' ? 'Add New Item' : 'Edit Item'}
						{selectedType ? ` - ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}` : ''}
					</DialogTitle>
					<DialogDescription>
						{mode === 'add' ? 'Add a new item to the menu.' : 'Edit an existing menu item.'}
					</DialogDescription>
				</DialogHeader>
				<form
					onSubmit={handleSubmit}
					className={`space-y-4`}
				>
					{mode === 'add' && !selectedType && (
						<div className="space-y-2">
							<Label htmlFor="itemType">Select Item Type</Label>
							<Select onValueChange={(value) => setSelectedType(value as ItemType)}>
								<SelectTrigger>
									<SelectValue placeholder="Select item type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="main">Main</SelectItem>
									<SelectItem value="probiotic">Probiotic</SelectItem>
									<SelectItem value="fruit">Fruit</SelectItem>
									<SelectItem value="drink">Drink</SelectItem>
									<SelectItem value="addon">Add-On</SelectItem>
									<SelectItem value="platter">Platter</SelectItem>
								</SelectContent>
							</Select>
						</div>
					)}

					{(mode === 'edit' || selectedType) && (
						<>
							<div className="space-y-2">
								<Label htmlFor="display">Item Name</Label>
								<Input
									id="display"
									value={formData.display || ''}
									onChange={(e) => handleInputChange('display', e.target.value)}
									required
								/>
							</div>

							{(selectedType === 'main' || selectedType === 'drink' || selectedType === 'platter') && (
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
										<div className="mt-2">
											<img
												src={imagePreviewUrl}
												alt="Preview"
												className="max-w-full h-auto max-h-40 object-contain"
											/>
											<Button
												type="button"
												onClick={handleClearImage}
												variant="destructive"
												size="sm"
												className="mt-2"
											>
												Clear Image
											</Button>
										</div>
									)}
								</div>
							)}

							{(selectedType === 'main' ||
								selectedType === 'drink' ||
								selectedType === 'addon' ||
								selectedType === 'platter') && (
								<div className="space-y-2">
									<Label htmlFor="price">Price</Label>
									<Input
										id="price"
										type="number"
										value={formData.price || ''}
										onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
										step="0.01"
										min="0"
									/>
								</div>
							)}

							{(selectedType === 'main' || selectedType === 'platter') && (
								<>
									<div className="space-y-2">
										<Label htmlFor="description">Description</Label>
										<Textarea
											id="description"
											value={formData.description || ''}
											onChange={(e) => handleInputChange('description', e.target.value)}
										/>
									</div>

									{selectedType === 'main' && (
										<>
											<div className="space-y-2">
												<Label htmlFor="allergens">Allergens</Label>
												<MultiSelect
													isMulti
													name="allergens"
													options={allergenOptions}
													className="basic-multi-select"
													classNamePrefix="select"
													value={allergenOptions.filter((option) =>
														formData.allergens?.includes(option.value)
													)}
													onChange={handleAllergenChange}
													styles={{
														control: (base) => ({
															...base,
															borderColor: 'hsl(var(--input))',
															'&:hover': {
																borderColor: 'hsl(var(--input))',
															},
														}),
														menu: (base) => ({
															...base,
															backgroundColor: 'hsl(var(--background))',
															border: '1px solid hsl(var(--input))',
														}),
														option: (base, state) => ({
															...base,
															backgroundColor: state.isFocused
																? 'hsl(var(--accent))'
																: 'transparent',
															color: 'hsl(var(--foreground))',
														}),
													}}
												/>
											</div>
											<div className="grid grid-cols-2 gap-4 pt-2">
												<div className="flex items-center space-x-2">
													<Switch
														id="isNew"
														checked={formData.isNew ?? true}
														onCheckedChange={(checked) =>
															handleInputChange('isNew', checked)
														}
													/>
													<Label htmlFor="isNew">New Item</Label>
												</div>

												<div className="flex items-center space-x-2">
													<Switch
														id="isActive"
														checked={formData.isActive ?? true}
														onCheckedChange={(checked) =>
															handleInputChange('isActive', checked)
														}
													/>
													<Label htmlFor="isActive">Available</Label>
												</div>

												<div className="flex items-center space-x-2">
													<Switch
														id="isFeatured"
														checked={formData.isFeatured || false}
														onCheckedChange={(checked) =>
															handleInputChange('isFeatured', checked)
														}
													/>
													<Label htmlFor="isFeatured">Featured</Label>
												</div>

												<div className="flex items-center space-x-2">
													<Switch
														id="isVegetarian"
														checked={formData.isVegetarian || false}
														onCheckedChange={(checked) =>
															handleInputChange('isVegetarian', checked)
														}
													/>
													<Label htmlFor="isVegetarian">Vegetarian</Label>
												</div>
											</div>
										</>
									)}
								</>
							)}
						</>
					)}

					<DialogFooter className="pt-8">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isLoading}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="default"
							disabled={isLoading || (mode === 'add' && !selectedType)}
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									{mode === 'add' ? 'Adding...' : 'Updating...'}
								</>
							) : (
								<>{mode === 'add' ? 'Add' : 'Update'} Item</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default ItemModal;
