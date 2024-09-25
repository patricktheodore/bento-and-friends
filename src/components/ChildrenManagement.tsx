import React, { useState } from 'react';
import { Child, User } from '../models/user.model';
import { PlusIcon } from '@heroicons/react/16/solid';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';
import { Loader2 } from 'lucide-react';

import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface ChildrenManagementProps {
	user: User;
	onAddChild: (child: Omit<Child, 'id'>) => void;
	onRemoveChild: (childId: string) => void;
	onEditChild: (childId: string, child: Omit<Child, 'id'>) => void;
}

interface SchoolOption {
	value: string;
	label: string;
}

const ChildrenManagement: React.FC<ChildrenManagementProps> = ({ user, onAddChild, onRemoveChild, onEditChild }) => {
	const { state } = useAppContext();
	const [newChild, setNewChild] = useState<Omit<Child, 'id'>>(new Child());
	const [editingChild, setEditingChild] = useState<Child | null>(null);
	const [isChildModalOpen, setIsChildModalOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const schoolOptions: SchoolOption[] = state.schools.map((school) => ({
		value: school.name,
		label: school.name,
	}));

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		if (editingChild) {
			setEditingChild({ ...editingChild, [name]: value });
		} else {
			setNewChild((prev) => ({ ...prev, [name]: value }));
		}
	};

	const handleSchoolChange = (selectedOption: SchoolOption | null) => {
		if (editingChild) {
			setEditingChild({ ...editingChild, school: selectedOption ? selectedOption.value : '' });
		} else {
			setNewChild((prev) => ({ ...prev, school: selectedOption ? selectedOption.value : '' }));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			if (editingChild) {
				await onEditChild(editingChild.id, editingChild);
				setEditingChild(null);
				toast.success('Child updated successfully');
			} else {
				await onAddChild(newChild);
				setNewChild(new Child());
				toast.success('Child added successfully');
			}
			setIsChildModalOpen(false);
		} catch (error) {
			toast.error('An error occurred while managing the child');
		} finally {
			setIsLoading(false);
		}
	};

	const handleEditClick = (child: Child) => {
		setEditingChild(child);
		setIsChildModalOpen(true);
	};

	const handleRemoveClick = async () => {
		if (editingChild) {
			setIsLoading(true);
			try {
				await onRemoveChild(editingChild.id);
				setEditingChild(null);
				setIsChildModalOpen(false);
				toast.success('Child removed successfully');
			} catch (error) {
				toast.error('An error occurred while removing the child');
			} finally {
				setIsLoading(false);
			}
		}
	};

	return (
		<div className="w-full space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Children</h2>
				<Button
					onClick={() => {
						setEditingChild(null);
						setNewChild(new Child());
						setIsChildModalOpen(true);
					}}
					className="bg-brand-dark-green text-brand-cream"
				>
					<PlusIcon className="mr-2 h-4 w-4 text-sm" />
					  Add New Child
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
						</TableRow>
					</TableHeader>
					<TableBody>
						{user.children && user.children.map((child) => (
							<TableRow
								key={child.id}
								className="cursor-pointer"
								onClick={() => handleEditClick(child)}
							>
								<TableCell className="font-medium">{child.name}</TableCell>
								<TableCell>{child.school}</TableCell>
								<TableCell>{child.year}</TableCell>
								<TableCell>{child.className}</TableCell>
								<TableCell>{child.allergens || 'None'}</TableCell>
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
						<DialogTitle>{editingChild ? 'Edit Child' : 'Add New Child'}</DialogTitle>
					</DialogHeader>
					<form
						onSubmit={handleSubmit}
						className="space-y-4"
					>
						<div className="space-y-2">
							<Label htmlFor="name">Child's Name</Label>
							<Input
								id="name"
								name="name"
								value={editingChild ? editingChild.name : newChild.name}
								onChange={handleInputChange}
								placeholder="Enter child's name"
								required
								disabled={isLoading}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="school">School</Label>
							<Select
								id="school"
								name="school"
								options={schoolOptions}
								value={schoolOptions.find(
									(option) => option.value === (editingChild ? editingChild.school : newChild.school)
								)}
								onChange={handleSchoolChange}
								placeholder="Select School"
								isDisabled={isLoading}
							/>
						</div>
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
						<div className="space-y-2">
							<Label htmlFor="allergens">Allergens</Label>
							<Input
								id="allergens"
								name="allergens"
								value={editingChild ? editingChild.allergens : newChild.allergens}
								onChange={handleInputChange}
								placeholder="List allergens or 'None'"
								disabled={isLoading}
							/>
						</div>
						<DialogFooter>
							{editingChild && (
								<Button
									type="button"
									variant="destructive"
									onClick={handleRemoveClick}
									disabled={isLoading}
								>
									Remove Child
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
								disabled={isLoading}
							>
								{isLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										{editingChild ? 'Updating...' : 'Adding...'}
									</>
								) : (
									<>{editingChild ? 'Update Child' : 'Add Child'}</>
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
