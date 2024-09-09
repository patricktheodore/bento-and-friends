import React, { useState, useEffect } from 'react';
import { PencilIcon, PlusIcon } from '@heroicons/react/16/solid';
import { School } from '../models/school.model';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentUser } from '../services/auth';
import { getSchools } from '../services/school-operations';
import { useAppContext } from '../context/AppContext';
import Select from 'react-select';
import toast from 'react-hot-toast';

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

	// Function to add a new school
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

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target;
		const inputValue = type === 'checkbox' ? checked : value;

		if (editingSchool) {
			setEditingSchool({ ...editingSchool, [name]: inputValue });
		} else {
			setNewSchool((prev) => ({ ...prev, [name]: inputValue }));
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
	};

	const handleEditClick = (school: School) => {
		setEditingSchool(school);
		setIsSchoolModalOpen(true);
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

	return (
		<div className="w-full px-4">
			<div className="flex flex-col sm:flex-row justify-between items-center mb-4">
				<h2 className="w-full text-left text-2xl font-bold mb-2 sm:mb-0">Schools</h2>
				<button
					onClick={() => {
						setEditingSchool(null);
						setNewSchool(new School());
						setIsSchoolModalOpen(true);
					}}
					className="flex  justify-center items-center gap-2 text-sm rounded-md py-2 px-4 bg-brand-dark-green text-brand-cream hover:brightness-75 hover:ring-2 ring-offset-2 w-full sm:w-auto"
				>
					<PlusIcon className="h-5 w-5" />
					<span className='whitespace-nowrap'>Add New School</span>
				</button>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{state.schools.map((school) => (
					<div
						key={school.id}
						className="bg-stone-100 shadow-lg rounded-lg p-4 relative"
					>
						<button
							onClick={() => handleEditClick(school)}
							className="absolute gap-2 top-4 right-4 text-brand-gold hover:brightness-75 flex items-center"
							aria-label="Edit school"
						>
							<PencilIcon className="h-5 w-5" />
							Edit
						</button>
						<h3 className="font-bold text-lg mb-2 pr-8">
							<span>
								{school.isActive ? (
									<span className="w-3 h-3 bg-lime-500 rounded-full mr-2 inline-block"></span>
								) : (
									<span className="w-3 h-3 bg-red-500 rounded-full mr-2 inline-block"></span>
								)}
							</span>
							{school.name}
						</h3>
						<p className="text-gray-600 mb-2">{school.address}</p>
						<p className="text-sm text-gray-500 mb-2">Delivery Days: {school.deliveryDays.join(', ')}</p>
						<p className="text-sm text-gray-500 mb-2">Status: {school.isActive ? 'Active' : 'Inactive'}</p>
					</div>
				))}
			</div>

			{isSchoolModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
					<div className="bg-white p-6 rounded-lg w-full max-w-md">
						<h2 className="text-xl mb-4">{editingSchool ? 'Edit School' : 'Add New School'}</h2>
						<form
							onSubmit={handleSubmitSchool}
							className="flex flex-col gap-4"
						>
							<div>
								<label
									htmlFor="name"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									School Name
								</label>
								<input
									type="text"
									id="name"
									name="name"
									placeholder="Example Primary School"
									value={editingSchool ? editingSchool.name : newSchool.name}
									onChange={handleInputChange}
									className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-dark-green focus:border-brand-dark-green"
									required
								/>
							</div>
							<div>
								<label
									htmlFor="address"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Address
								</label>
								<input
									type="text"
									id="address"
									name="address"
									placeholder="123 Main Street, Suburb, PostCode"
									value={editingSchool ? editingSchool.address : newSchool.address}
									onChange={handleInputChange}
									className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-dark-green focus:border-brand-dark-green"
									required
								/>
							</div>
							<div>
								<label
									htmlFor="deliveryDays"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Delivery Days
								</label>
								<Select
									isMulti
									id="deliveryDays"
									name="deliveryDays"
									options={dayOptions}
									classNamePrefix="select"
									value={dayOptions.filter((option) =>
										(editingSchool ? editingSchool.deliveryDays : newSchool.deliveryDays).includes(
											option.value
										)
									)}
									onChange={handleDeliveryDaysChange}
									placeholder="Select Delivery Days"
								/>
							</div>
							{editingSchool ? (
								<ToggleSwitch
									id="isActive"
									checked={editingSchool ? editingSchool.isActive : newSchool.isActive}
									onChange={handleInputChange}
									label="Active"
								/>
							) : (
								''
							)}
							<div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
								<button
									type="button"
									onClick={() => {
										setIsSchoolModalOpen(false);
										setEditingSchool(null);
									}}
									className="px-4 py-2 bg-gray-200 rounded w-full sm:w-auto"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="px-4 py-2 bg-brand-dark-green text-white rounded w-full sm:w-auto"
								>
									{editingSchool ? 'Update School' : 'Add School'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default Schools;
