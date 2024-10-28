import React, { useEffect, useState } from 'react';
import { Child } from '../models/user.model';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface ChildManagementDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (child: Omit<Child, 'id'>) => Promise<void>;
	onRemove?: (childId: string) => Promise<void>;
	editingChild: Child | null;
}

const allergenOptions = ['Celiac', 'Dairy', 'Gluten', 'Soy', 'Eggs', 'Lactose', 'Other'];

const ChildManagementDialog: React.FC<ChildManagementDialogProps> = ({
	isOpen,
	onClose,
	onSubmit,
	onRemove,
	editingChild,
}) => {
	const { state } = useAppContext();
	const [childData, setChildData] = useState<Omit<Child, 'id'>>(new Child());
	const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
	const [otherAllergen, setOtherAllergen] = useState('');
	const [isTeacher, setIsTeacher] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

    const resetDialog = () => {
        setChildData(new Child());
        setSelectedAllergens([]);
        setOtherAllergen('');
        setIsTeacher(false);
        setIsLoading(false);
      };

      useEffect(() => {
        if (!isOpen) {
          resetDialog();
          return;
        }
    
        if (editingChild) {
          const allergens = editingChild.allergens ? editingChild.allergens.split(', ') : [];
          const standardAllergens = allergens.filter((a) => allergenOptions.includes(a));
          const otherAllergens = allergens.filter((a) => !allergenOptions.includes(a));
    
          setChildData(editingChild);
          setSelectedAllergens(standardAllergens);
          if (otherAllergens.length > 0) {
            setSelectedAllergens((prev) => [...prev, 'Other']);
            setOtherAllergen(otherAllergens.join(', '));
          } else {
            setOtherAllergen('');
          }
          setIsTeacher(editingChild.isTeacher || false);
        } else {
          // Set default school if only one exists
          const defaultSchool = state.schools.length === 1 ? state.schools[0].name : '';
          setChildData(new Child());
          setChildData((prev) => ({ ...prev, school: defaultSchool }));
          setSelectedAllergens([]);
          setOtherAllergen('');
          setIsTeacher(false);
        }
      }, [isOpen, editingChild, state.schools]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setChildData((prev) => ({ ...prev, [name]: value }));
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
          const allergens = getAllergenString();
          const child = {
            ...childData,
            allergens,
            isTeacher,
            year: isTeacher ? '' : childData.year,
            className: isTeacher ? '' : childData.className,
          };
          await onSubmit(child);
          resetDialog();
          onClose();
        } catch (error) {
          console.error('Error submitting child:', error);
        } finally {
          setIsLoading(false);
        }
      };

	const handleRemove = async () => {
		if (editingChild && onRemove) {
			setIsLoading(true);
			try {
				await onRemove(editingChild.id);
				onClose();
			} catch (error) {
				console.error('Error removing child:', error);
			} finally {
				setIsLoading(false);
			}
		}
	};

	const renderSchoolSelection = () => {
		if (state.schools.length === 1) {
			return (
				<Input
					value={state.schools[0].name}
					disabled
				/>
			);
		}

		return (
			<Select
				onValueChange={(value) => setChildData((prev) => ({ ...prev, school: value }))}
				value={childData.school}
			>
				<SelectTrigger>
					<SelectValue placeholder="Select School" />
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
		);
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
                if (!open) {
                  resetDialog();
                  onClose();
                }
              }}
		>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<div className="flex justify-between items-center">
						<DialogTitle>{editingChild ? 'Edit' : 'Add New'} Member</DialogTitle>
						<Button
							variant="ghost"
							size="icon"
							onClick={onClose}
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</DialogHeader>

				<form
					onSubmit={handleSubmit}
					className="space-y-4"
				>
					<div className="space-y-2">
						<Label htmlFor="name">Full Name*</Label>
						<Input
							id="name"
							name="name"
							value={childData.name}
							onChange={handleInputChange}
							placeholder="Enter member's name"
							required
							disabled={isLoading}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="school">School*</Label>
						{renderSchoolSelection()}
						<Link
							to="/contact"
							className="text-brand-dark-green text-xs hover:underline"
						>
							School not listed here?
						</Link>
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
								<Label htmlFor="year">Year*</Label>
								<Input
									id="year"
									name="year"
									value={childData.year}
									onChange={handleInputChange}
									placeholder="Enter year"
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="className">Class*</Label>
								<Input
									id="className"
									name="className"
									value={childData.className}
									onChange={handleInputChange}
									placeholder="Enter class"
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
					<DialogFooter>
						{editingChild && onRemove && (
							<Button
								type="button"
								variant="destructive"
								onClick={handleRemove}
								disabled={isLoading}
							>
								Remove
							</Button>
						)}
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
							disabled={
								isLoading ||
								!childData.name ||
								(!isTeacher && (!childData.year || !childData.className))
							}
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									{editingChild ? 'Updating...' : 'Adding...'}
								</>
							) : (
								<>{editingChild ? 'Update' : 'Add'}</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default ChildManagementDialog;
