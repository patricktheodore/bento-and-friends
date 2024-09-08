import React, { useState } from 'react';
import { Child } from '../models/user.model';
import { School } from '../models/school.model';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/16/solid';
import { useAppContext } from '../context/AppContext';
import Select from 'react-select';

interface ChildrenManagementProps {
	children: Child[];
	onAddChild: (child: Omit<Child, 'id'>) => void;
	onRemoveChild: (childId: string) => void;
	onEditChild: (childId: string, child: Omit<Child, 'id'>) => void;
}

interface SchoolOption {
    value: string;
    label: string;
}
  

const ChildrenManagement: React.FC<ChildrenManagementProps> = ({
	children,
	onAddChild,
	onRemoveChild,
	onEditChild,
}) => {
    const { state, dispatch } = useAppContext();
	const [newChild, setNewChild] = useState<Omit<Child, 'id'>>(new Child());
	const [editingChild, setEditingChild] = useState<Child | null>(null);
	const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);

    const schoolOptions: SchoolOption[] = state.schools.map(school => ({
        value: school.name,
        label: school.name
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
          setNewChild(prev => ({ ...prev, school: selectedOption ? selectedOption.value : '' }));
        }
    };

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (editingChild) {
			onEditChild(editingChild.id, editingChild);
			setEditingChild(null);
		} else {
			onAddChild(newChild);
			setNewChild(new Child());
		}
		setIsAddChildModalOpen(false);
	};

	const handleEditClick = (child: Child) => {
		setEditingChild(child);
		setIsAddChildModalOpen(true);
	};

	return (
		<div className="w-full">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-bold">Children</h2>
				<button
					onClick={() => {
						setEditingChild(null);
						setIsAddChildModalOpen(true);
					}}
					className="flex items-center gap-2 text-sm rounded-md py-2 px-4 bg-brand-dark-green text-brand-cream hover:brightness-110"
				>
					<PlusIcon className="h-5 w-5" />
					<span>Add Child</span>
				</button>
			</div>

			<table className="min-w-full divide-y divide-gray-200">
				<thead className="bg-gray-50">
					<tr>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Name
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							School
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Year - Class
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Actions
						</th>
					</tr>
				</thead>
				<tbody className="bg-white divide-y divide-gray-200">
					{children.map((child) => (
						<tr key={child.id}>
							<td className="px-6 py-4 whitespace-nowrap">{child.name}</td>
							<td className="px-6 py-4 whitespace-nowrap">{child.school}</td>
							<td className="px-6 py-4 whitespace-nowrap">
								{child.year} - {child.className}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
								<button
									onClick={() => handleEditClick(child)}
									className="text-indigo-600 hover:text-indigo-900 mr-2"
								>
									<PencilIcon className="h-5 w-5" />
								</button>
								<button
									onClick={() => onRemoveChild(child.id)}
									className="text-red-600 hover:text-red-900"
								>
									<TrashIcon className="h-5 w-5" />
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{isAddChildModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
					<div className="bg-white p-6 rounded-lg">
						<h2 className="text-xl mb-4">{editingChild ? 'Edit Child' : 'Add New Child'}</h2>
						<form
							onSubmit={handleSubmit}
							className="flex flex-col gap-2"
						>
							<input
								type="text"
								name="name"
								value={editingChild ? editingChild.name : newChild.name}
								onChange={handleInputChange}
								placeholder="Child's Name"
								className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-dark-green focus:border-brand-dark-green"
								required
							/>
							{/* <input
								type="text"
								name="school"
								value={editingChild ? editingChild.school : newChild.school}
								onChange={handleInputChange}
								placeholder="School"
								className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-dark-green focus:border-brand-dark-green"
								required
							/> */}
                            <Select
                                name="school"
                                options={schoolOptions}
                                value={schoolOptions.find(option => option.value === (editingChild ? editingChild.school : newChild.school))}
                                onChange={handleSchoolChange}
                                placeholder="Select School"
                                className="mb-2"
                            />
							<div className="flex gap-2">
								<input
									type="text"
									name="year"
									value={editingChild ? editingChild.year : newChild.year}
									onChange={handleInputChange}
									placeholder="Year"
									className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-dark-green focus:border-brand-dark-green"
									required
								/>
								<input
									type="text"
									name="className"
									value={editingChild ? editingChild.className : newChild.className}
									onChange={handleInputChange}
									placeholder="Class"
									className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-dark-green focus:border-brand-dark-green"
									required
								/>
							</div>
							<div className="flex justify-end gap-2 mt-4">
								<button
									type="button"
									onClick={() => {
										setIsAddChildModalOpen(false);
										setEditingChild(null);
									}}
									className="px-4 py-2 bg-gray-200 rounded"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="px-4 py-2 bg-brand-dark-green text-white rounded"
								>
									{editingChild ? 'Update Child' : 'Add Child'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default ChildrenManagement;
