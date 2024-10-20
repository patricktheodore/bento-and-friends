import React, { useEffect, useState } from 'react';
import { Child, User } from '../models/user.model';
import { PlusIcon } from '@heroicons/react/16/solid';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';
import { Loader2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Link } from 'react-router-dom';
import { Checkbox } from './ui/checkbox';

interface ChildrenManagementProps {
	user: User;
	onAddChild: (child: Omit<Child, 'id'>) => void;
	onRemoveChild: (childId: string) => void;
	onEditChild: (childId: string, child: Omit<Child, 'id'>) => void;
}

const allergenOptions = ['Celiac', 'Dairy', 'Gluten', 'Soy', 'Eggs', 'Lactose', 'Other'];

const ChildrenManagement: React.FC<ChildrenManagementProps> = ({ user, onAddChild, onRemoveChild, onEditChild }) => {
	const { state } = useAppContext();
	const [newChild, setNewChild] = useState<Omit<Child, 'id'>>(new Child());
	const [editingChild, setEditingChild] = useState<Child | null>(null);
	const [isChildModalOpen, setIsChildModalOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
	const [otherAllergen, setOtherAllergen] = useState('');
	const [isTeacher, setIsTeacher] = useState(false);

	useEffect(() => {
		if (editingChild) {
			const allergens = editingChild.allergens ? editingChild.allergens.split(', ') : [];
			const standardAllergens = allergens.filter((a) => allergenOptions.includes(a));
			const otherAllergens = allergens.filter((a) => !allergenOptions.includes(a));

            if (state.schools.length === 1) {
                setNewChild(prev => ({ ...prev, school: state.schools[0].name }));
            } else if (user.children.length > 0) {
                setNewChild(prev => ({ ...prev, school: user.children[0].school }));
            }

			setSelectedAllergens(standardAllergens);
			if (otherAllergens.length > 0) {
				setSelectedAllergens((prev) => [...prev, 'Other']);
				setOtherAllergen(otherAllergens.join(', '));
			} else {
				setOtherAllergen('');
			}
			setIsTeacher(editingChild.isTeacher || false);
			setIsLoading(false);
		} else {
			setSelectedAllergens([]);
			setOtherAllergen('');
			setIsTeacher(false);
			setIsLoading(false);
		}
	}, [editingChild, state.schools, user.children]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		if (editingChild) {
			setEditingChild({ ...editingChild, [name]: value });
		} else {
			setNewChild((prev) => ({ ...prev, [name]: value }));
		}
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

			const childData = {
				...(editingChild || newChild),
				allergens,
				isTeacher,
				year: isTeacher ? '' : (editingChild?.year || newChild.year),
				className: isTeacher ? '' : (editingChild?.className || newChild.className),
			};

			if (editingChild) {
				await onEditChild(editingChild.id, childData);
				setEditingChild(null);
				toast.success('Member updated successfully');
			} else {
				await onAddChild(childData);
				setNewChild(new Child());
				toast.success('Member added successfully');
			}
			setIsChildModalOpen(false);
		} catch (error) {
			toast.error('An error occurred while managing the member');
		} finally {
			setIsLoading(false);
		}
	};

	const handleEditClick = (child: Child) => {
		setEditingChild(child);
		setSelectedAllergens(child.allergens ? child.allergens.split(', ') : []);
		setOtherAllergen('');
		setIsTeacher(child.isTeacher || false);
		setIsChildModalOpen(true);
	};

	const handleRemoveClick = async () => {
		if (editingChild) {
			setIsLoading(true);
			try {
				await onRemoveChild(editingChild.id);
				setEditingChild(null);
				setIsChildModalOpen(false);
				toast.success('Member removed successfully');
			} catch (error) {
				toast.error('An error occurred while removing the member');
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
                onValueChange={(value) => {
                    if (editingChild) {
                        setEditingChild({ ...editingChild, school: value });
                    } else {
                        setNewChild((prev) => ({ ...prev, school: value }));
                    }
                }}
                value={editingChild ? editingChild.school : newChild.school}
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
		<div className="w-full space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Children / Members</h2>
				<Button
					onClick={() => {
						setEditingChild(null);
						setNewChild(new Child());
						setSelectedAllergens([]);
						setOtherAllergen('');
						setIsTeacher(false);
						setIsChildModalOpen(true);
					}}
					className="bg-brand-dark-green text-brand-cream"
				>
					<PlusIcon className="mr-2 h-4 w-4 text-sm" />
					Add Member
				</Button>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[250px]">Name</TableHead>
							<TableHead>School</TableHead>
							<TableHead>Year</TableHead>
							<TableHead>Class</TableHead>
							<TableHead>Allergens</TableHead>
							<TableHead>Role</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{user.children &&
							user.children.map((child) => (
								<TableRow
									key={child.id}
									className="cursor-pointer"
									onClick={() => handleEditClick(child)}
								>
									<TableCell className="font-medium">{child.name}</TableCell>
									<TableCell>{child.school}</TableCell>
									<TableCell>{child.isTeacher ? '-' : child.year}</TableCell>
									<TableCell>{child.isTeacher ? '-' : child.className}</TableCell>
									<TableCell>{child.allergens || 'None'}</TableCell>
									<TableCell>{child.isTeacher ? 'Teacher' : 'Student'}</TableCell>
								</TableRow>
							))}
					</TableBody>
				</Table>
			</div>

			<Dialog
				open={isChildModalOpen}
				onOpenChange={(open) => {
					if (!open && !isLoading) setIsChildModalOpen(false);
				}}
			>
				<DialogContent className={`sm:max-w-[425px] ${isLoading ? 'opacity-75 pointer-events-none' : ''}`}>
					<DialogHeader>

						<div className="flex flex-row justify-between items-center">
							<DialogTitle>{editingChild ? 'Edit' : 'Add New'} Member</DialogTitle>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsChildModalOpen(false)}
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
							<Label htmlFor="name">Full Name</Label>
							<Input
								id="name"
								name="name"
								value={editingChild ? editingChild.name : newChild.name}
								onChange={handleInputChange}
								placeholder="Enter member's name"
								required
								disabled={isLoading}
							/>
						</div>
						<div className="space-y-2">
                            <Label htmlFor="school">School</Label>
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
									<Label htmlFor="year">Year</Label>
									<Input
										id="year"
										name="year"
										value={editingChild ? editingChild.year : newChild.year}
										onChange={handleInputChange}
										placeholder="Enter year"
										required
										disabled={isLoading}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="className">Class</Label>
									<Input
										id="className"
										name="className"
										value={editingChild ? editingChild.className : newChild.className}
										onChange={handleInputChange}
										placeholder="Enter class"
										required
										disabled={isLoading}
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
							{editingChild && (
								<Button
									type="button"
									variant="destructive"
									onClick={handleRemoveClick}
									disabled={isLoading}
								>
									Remove
								</Button>
							)}
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsChildModalOpen(false)}
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={isLoading || !newChild.name|| (!isTeacher && (!newChild.year || !newChild.className))}
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
		</div>
	);
};

export default ChildrenManagement;