import React, { useState } from 'react';
import { Child, User } from '../models/user.model';
import { PlusIcon, PencilIcon, UserGroupIcon, CreditCardIcon } from '@heroicons/react/16/solid';
import { useAppContext } from '../context/AppContext';
import Select from 'react-select';
import toast from 'react-hot-toast';

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

const ChildrenManagement: React.FC<ChildrenManagementProps> = ({
	user,
	onAddChild,
	onRemoveChild,
	onEditChild,
}) => {
	const { state, dispatch } = useAppContext();
	const [newChild, setNewChild] = useState<Omit<Child, 'id'>>(new Child());
	const [editingChild, setEditingChild] = useState<Child | null>(null);
	const [isChildModalOpen, setIsChildModalOpen] = useState(false);

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

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (editingChild) {
			onEditChild(editingChild.id, editingChild);
			setEditingChild(null);
			toast.success('Child updated successfully');
		} else {
			onAddChild(newChild);
			setNewChild(new Child());
			toast.success('Child added successfully');
		}
		setIsChildModalOpen(false);
	};

	const handleEditClick = (child: Child) => {
		setEditingChild(child);
		setIsChildModalOpen(true);
	};

	const handleRemoveClick = () => {
		if (editingChild) {
			onRemoveChild(editingChild.id);
			setEditingChild(null);
			setIsChildModalOpen(false);
			toast.success('Child removed successfully');
		}
	};

	return (
        <div className="w-full">
          <div className="bg-stone-50 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Children / Students</h3>
              <button
                onClick={() => {
                  setEditingChild(null);
                  setNewChild(new Child());
                  setIsChildModalOpen(true);
                }}
                className="flex items-center gap-2 text-sm rounded-md py-2 px-4 bg-brand-dark-green text-brand-cream hover:brightness-75 hover:ring-2 ring-offset-2"
              >
                <PlusIcon className="h-5 w-5" />
                <span className="whitespace-nowrap">Add Child</span>
              </button>
            </div>
    
            <div className="border-t border-gray-200">
              {user.children.map((child) => (
                <div
                  key={child.id}
                  className="px-4 py-5 sm:p-6 border-b border-gray-200 last:border-b-0"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{child.name}</h4>
                      <p className="mt-1 text-sm text-gray-500">{child.school}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        Year: {child.year}, Class: {child.className}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Allergens: {child.allergens || 'None'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEditClick(child)}
                      className="text-brand-gold hover:text-brand-dark-green flex flex-nowrap items-center gap-2"
                      aria-label="Edit child"
                    >
                      <PencilIcon className="h-5 w-5" />
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
    
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
				<div className="bg-stone-50 overflow-hidden shadow rounded-lg">
					<div className="p-5">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<CreditCardIcon
									className="h-6 w-6 text-gray-400"
									aria-hidden="true"
								/>
							</div>
							<div className="ml-5 w-0 flex-1">
								<dl>
									<dt className="text-sm font-medium text-gray-500 truncate">Total orders</dt>
									<dd>
										<div className="text-lg font-medium text-gray-900">
											{user.orderHistory?.length || 0}
										</div>
									</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>

				<div className="bg-stone-50 overflow-hidden shadow rounded-lg">
					<div className="p-5">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<UserGroupIcon
									className="h-6 w-6 text-gray-400"
									aria-hidden="true"
								/>
							</div>
							<div className="ml-5 w-0 flex-1">
								<dl>
									<dt className="text-sm font-medium text-gray-500 truncate">Registered children</dt>
									<dd>
										<div className="text-lg font-medium text-gray-900">
											{user.children?.length || 0}
										</div>
									</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>
			</div>
    
          {isChildModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl mb-4">{editingChild ? 'Edit Child' : 'Add New Child'}</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name*
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={editingChild ? editingChild.name : newChild.name}
                      onChange={handleInputChange}
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-dark-green focus:border-brand-dark-green"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
                      School*
                    </label>
                    <Select
                      id="school"
                      name="school"
                      options={schoolOptions}
                      value={schoolOptions.find(
                        (option) => option.value === (editingChild ? editingChild.school : newChild.school)
                      )}
                      onChange={handleSchoolChange}
                      placeholder="Select School"
                      className="mb-2"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                        Year*
                      </label>
                      <input
                        type="text"
                        id="year"
                        name="year"
                        value={editingChild ? editingChild.year : newChild.year}
                        onChange={handleInputChange}
                        className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-dark-green focus:border-brand-dark-green"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="className" className="block text-sm font-medium text-gray-700 mb-1">
                        Class*
                      </label>
                      <input
                        type="text"
                        id="className"
                        name="className"
                        value={editingChild ? editingChild.className : newChild.className}
                        onChange={handleInputChange}
                        className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-dark-green focus:border-brand-dark-green"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="allergens" className="block text-sm font-medium text-gray-700 mb-1">
                      Allergens
                    </label>
                    <input
                      id="allergens"
                      name="allergens"
                      value={editingChild ? editingChild.allergens : newChild.allergens}
                      onChange={handleInputChange}
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-dark-green focus:border-brand-dark-green"
                      placeholder="List any allergies or 'None' if no allergies"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                    {editingChild && (
                      <button
                        type="button"
                        onClick={handleRemoveClick}
                        className="px-4 py-2 bg-red-500 text-white rounded-md w-full sm:w-auto hover:brightness-75 hover:ring-2 ring-offset-2"
                      >
                        Remove
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsChildModalOpen(false);
                        setEditingChild(null);
                      }}
                      className="px-4 py-2 bg-gray-200 rounded-md hover:brightness-75 hover:ring-2 ring-offset-2 w-full sm:w-auto"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-md py-2 px-4 bg-brand-dark-green text-brand-cream hover:brightness-75 hover:ring-2 ring-offset-2 w-full sm:w-auto"
                    >
                      {editingChild ? 'Update' : 'Add'}
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
