import React, { useState } from 'react';
import { Child, User } from '../models/user.model';
import { PlusIcon } from '@heroicons/react/16/solid';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import ChildManagementDialog from './ChildManagementDialog';
import { School } from '@/models/school.model';
import { useAppContext } from '@/context/AppContext';

interface ChildrenManagementProps {
	user: User;
	onAddChild: (child: Omit<Child, 'id'>) => Promise<void>;
	onRemoveChild: (childId: string) => Promise<void>;
	onEditChild: (childId: string, child: Omit<Child, 'id'>) => Promise<void>;
}

const ChildrenManagement: React.FC<ChildrenManagementProps> = ({ user, onAddChild, onRemoveChild, onEditChild }) => {
    const { state } = useAppContext();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [selectedChild, setSelectedChild] = useState<Child | null>(null);
    const [schools] = useState<School[]>(state.schools);

	const getSchoolName = (schoolId: string | undefined): string => {
		if (!schoolId) return 'No school selected';
		
		const school = schools.find(s => s.id === schoolId);
		return school ? school.name : 'Unknown school';
	};

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
			setIsDialogOpen(false); // Close dialog on success
		} catch (error) {
			console.error('Error managing child:', error);
		}
	};

	const handleRemove = async (childId: string) => {
		try {
			await onRemoveChild(childId);
			toast.success('Member removed successfully');
			setIsDialogOpen(false); // Close dialog on success
		} catch (error) {
			console.error('Error removing child:', error);
			// Don't show toast here - AccountPage handlers already show error toasts
		}
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex justify-between items-center">
					<CardTitle className="text-xl">Children / Members</CardTitle>
					<Button
						onClick={handleAdd}
						className="bg-brand-dark-green text-brand-cream"
					>
						<PlusIcon className="mr-2 h-4 w-4 text-sm" />
						Add Member
					</Button>
				</div>
			</CardHeader>
			<CardContent>
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
									<TableCell>{getSchoolName(child.schoolId)}</TableCell>
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
			</CardContent>
		</Card>
	);
};

export default ChildrenManagement;