import React, { useState } from 'react';
import { Child, User } from '../models/user.model';
import { PlusIcon } from '@heroicons/react/16/solid';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import ChildManagementDialog from './ChildManagementDialog';

interface ChildrenManagementProps {
	user: User;
	onAddChild: (child: Omit<Child, 'id'>) => void;
	onRemoveChild: (childId: string) => void;
	onEditChild: (childId: string, child: Omit<Child, 'id'>) => void;
}

const ChildrenManagement: React.FC<ChildrenManagementProps> = ({ user, onAddChild, onRemoveChild, onEditChild }) => {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [selectedChild, setSelectedChild] = useState<Child | null>(null);

	const handleEditClick = (child: Child) => {
		setSelectedChild(child);
		setIsDialogOpen(true);
	};

	const handleAdd = () => {
		setSelectedChild(null);
		setIsDialogOpen(true);
	};

	const handleSubmit = async (childData: Omit<Child, 'id'>) => {
		try {
			if (selectedChild) {
				await onEditChild(selectedChild.id, childData);
				toast.success('Member updated successfully');
			} else {
				await onAddChild(childData);
				toast.success('Member added successfully');
			}
		} catch (error) {
			console.error('Error managing child:', error);
			toast.error('An error occurred while managing the member');
		}
	};

	const handleRemove = async (childId: string) => {
		try {
			await onRemoveChild(childId);
			toast.success('Member removed successfully');
		} catch (error) {
			console.error('Error removing child:', error);
			toast.error('An error occurred while removing the member');
		}
	};

	return (
		<div className="w-full space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Children / Members</h2>
				<Button
					onClick={handleAdd}
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
						{user.children?.map((child) => (
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

			<ChildManagementDialog
				isOpen={isDialogOpen}
				onClose={() => setIsDialogOpen(false)}
				onSubmit={handleSubmit}
				onRemove={handleRemove}
				editingChild={selectedChild}
			/>
		</div>
	);
};

export default ChildrenManagement;
