import React, { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/16/solid';
import { School } from '../models/school.model';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentUser } from '../services/auth';
import { getSchools } from '../services/school-operations';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import MultiSelect from 'react-select';
import { Loader2 } from 'lucide-react';

import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

interface DayOption {
	value: string;
	label: string;
}

const dayOptions: DayOption[] = [
	{ value: 'Monday', label: 'Monday' },
	{ value: 'Tuesday', label: 'Tuesday' },
	{ value: 'Wednesday', label: 'Wednesday' },
	{ value: 'Thursday', label: 'Thursday' },
	{ value: 'Friday', label: 'Friday' },
];

const Schools: React.FC = () => {
	const { state, dispatch } = useAppContext();
	const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);
	const [editingSchool, setEditingSchool] = useState<School | null>(null);
	const [newSchool, setNewSchool] = useState<School>(new School());
    const [isLoading, setIsLoading] = useState(false);

	const addOrUpdateSchool = async (school: School): Promise<{ success: boolean; data?: School; error?: string }> => {
		try {
			const schoolRef = doc(db, 'schools', school.id);
			await setDoc(
				schoolRef,
				{
					name: school.name,
					address: school.address,
					isActive: school.isActive,
					deliveryDays: school.deliveryDays,
					scheduledDates: school.scheduledDates,
				},
				{ merge: true }
			);

			dispatch({ type: editingSchool ? 'UPDATE_SCHOOL' : 'ADD_SCHOOL', payload: school });
			return { success: true, data: school };
		} catch (error) {
			console.error('Error adding/updating school: ', error);
			return { success: false, error: (error as Error).message };
		}
	};

	useEffect(() => {
		const fetchSchoolsAndCheckAdmin = async () => {
			try {
				const user = await getCurrentUser();
				if (!user) {
					toast.error('User not authenticated');
					return;
				}

				const adminStatus = user.isAdmin;
				setIsAdmin(adminStatus);

				const response = await getSchools();
				if (response.success && response.data) {
					dispatch({ type: 'SET_SCHOOLS', payload: response.data });
				} else {
					toast.error(response.error || 'Failed to fetch schools');
				}
			} catch (error) {
				toast.error((error as Error).message);
			}
		};

		fetchSchoolsAndCheckAdmin();
	}, [dispatch]);

	const handleInputChange = (name: string, value: string | boolean) => {
        if (editingSchool) {
            setEditingSchool({ ...editingSchool, [name]: value });
        } else {
            setNewSchool((prev) => ({ ...prev, [name]: value }));
        }
    };

	const handleDeliveryDaysChange = (selectedOptions: readonly DayOption[]) => {
        const selectedDays = selectedOptions.map((option) => option.value);
        if (editingSchool) {
            setEditingSchool({ ...editingSchool, deliveryDays: selectedDays });
        } else {
            setNewSchool((prev) => ({ ...prev, deliveryDays: selectedDays }));
        }
    };

	const handleSubmitSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAdmin) {
            toast.error('Only admins can manage schools');
            return;
        }
        setIsLoading(true);
        try {
            const schoolToSave = editingSchool || newSchool;
            const response = await addOrUpdateSchool(schoolToSave);
            if (response.success && response.data) {
                setIsSchoolModalOpen(false);
                setEditingSchool(null);
                setNewSchool(new School());
                toast.success(editingSchool ? 'School updated successfully' : 'School added successfully');
            } else {
                toast.error(response.error || 'Failed to manage school');
            }
        } catch (error) {
            console.error('Error submitting school:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (school: School) => {
        setEditingSchool(school);
        setIsSchoolModalOpen(true);
    };

	if (!isAdmin) {
        return <div>You do not have permission to access this page.</div>;
    }

	return (
        <div className="w-full px-4 space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Schools</h2>
                <Button 
                    onClick={() => {
                        setEditingSchool(null);
                        setNewSchool(new School());
                        setIsSchoolModalOpen(true);
                    }}
                    className="bg-brand-dark-green text-brand-cream"
                >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add New School
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[250px]">Name</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Delivery Days</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {state.schools.map((school) => (
                            <TableRow 
                                key={school.id}
                                className="cursor-pointer"
                                onClick={() => handleEditClick(school)}
                            >
                                <TableCell className="font-medium">
                                    <div className="flex items-center">
                                        <span className={`w-2 h-2 ${school.isActive ? 'bg-green-500' : 'bg-red-500'} rounded-full mr-2`}></span>
                                        {school.name}
                                    </div>
                                </TableCell>
                                <TableCell>{school.address}</TableCell>
                                <TableCell>{school.deliveryDays.join(', ')}</TableCell>
                                <TableCell>{school.isActive ? 'Active' : 'Inactive'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isSchoolModalOpen} onOpenChange={(open) => {
                if (!open && !isLoading) setIsSchoolModalOpen(false);
            }}>
                <DialogContent className={`sm:max-w-[425px] ${isLoading ? 'opacity-75 pointer-events-none' : ''}`}>
                    <DialogHeader>
                        <DialogTitle>{editingSchool ? 'Edit School' : 'Add New School'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitSchool} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">School Name</Label>
                            <Input
                                id="name"
                                value={editingSchool ? editingSchool.name : newSchool.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Example Primary School"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={editingSchool ? editingSchool.address : newSchool.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                placeholder="123 Main Street, Suburb, PostCode"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="deliveryDays">Delivery Days</Label>
                            <MultiSelect
                                isMulti
                                id="deliveryDays"
                                name="deliveryDays"
                                options={dayOptions}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                value={dayOptions.filter((option) => 
                                    (editingSchool ? editingSchool.deliveryDays : newSchool.deliveryDays).includes(option.value)
                                )}
                                onChange={handleDeliveryDaysChange}
                                isDisabled={isLoading}
                                // ... (keep your existing styles)
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isActive"
                                checked={editingSchool ? editingSchool.isActive : newSchool.isActive}
                                onCheckedChange={(checked) => handleInputChange('isActive', checked as boolean)}
                                disabled={isLoading}
                            />
                            <Label htmlFor="isActive">Active</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsSchoolModalOpen(false)} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {editingSchool ? 'Updating...' : 'Adding...'}
                                    </>
                                ) : (
                                    <>{editingSchool ? 'Update School' : 'Add School'}</>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Schools;
