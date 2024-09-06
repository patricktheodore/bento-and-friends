import React, { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/16/solid';
import { School, Class } from '../models/school.model';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentUser } from '../services/auth';

const Schools: React.FC = () => {
	const [schools, setSchools] = useState<School[]>([]);
	const [isAddSchoolModalOpen, setIsAddSchoolModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
	const [newSchool, setNewSchool] = useState<Omit<School, 'id' | 'scheduledDates' | 'isActive'>>({
		name: '',
		address: '',
		deliveryDays: [],
		classes: [],
	});

	// Function to get all schools
	const getSchools = async (): Promise<{ success: boolean; data?: School[]; error?: string }> => {
		try {
			const schoolsCollection = collection(db, 'schools');
			const schoolSnapshot = await getDocs(schoolsCollection);
			const schoolList = schoolSnapshot.docs.map(
				(doc) =>
					({
						id: doc.id,
						...doc.data(),
					} as School)
			); // Cast to School type
			return { success: true, data: schoolList };
		} catch (error) {
			console.error('Error getting schools: ', error);
			return { success: false, error: (error as Error).message };
		}
	};

	// Function to add a new school
	const addSchool = async (
		schoolData: Omit<School, 'id' | 'isActive' | 'scheduledDates'>
	): Promise<{ success: boolean; data?: School; error?: string }> => {
		try {
			const schoolsCollection = collection(db, 'schools');
			const docRef = await addDoc(schoolsCollection, {
				...schoolData,
				isActive: true,
				scheduledDates: [],
			});
			const newSchool: School = {
				id: docRef.id,
				...schoolData,
				isActive: true,
				scheduledDates: [],
			};
			return { success: true, data: newSchool };
		} catch (error) {
			console.error('Error adding school: ', error);
			return { success: false, error: (error as Error).message };
		}
	};

    useEffect(() => {
        const fetchSchoolsAndCheckAdmin = async () => {
          try {
            const user = await getCurrentUser();
            if (!user) {
              setError('User not authenticated');
              return;
            }
    
            const adminStatus = user.isAdmin;
            setIsAdmin(adminStatus);
    
            const response = await getSchools();
            if (response.success && response.data) {
              setSchools(response.data);
            } else {
              setError(response.error || 'Failed to fetch schools');
            }
          } catch (error) {
            setError((error as Error).message);
          }
        };
    
        fetchSchoolsAndCheckAdmin();
      }, []);
    

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setNewSchool((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmitSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAdmin) {
          setError('Only admins can add schools');
          return;
        }
        const response = await addSchool(newSchool);
        if (response.success && response.data) {
          setSchools([...schools, response.data]);
          setIsAddSchoolModalOpen(false);
          setNewSchool({ name: '', address: '', deliveryDays: [], classes: [] });
        } else {
          setError(response.error || 'Failed to add school');
        }
      };

	return (
		<div className="w-full">
            {error && <div className="text-red-500">{error}</div>}
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-bold">Schools</h2>
				<button
					onClick={() => setIsAddSchoolModalOpen(true)}
					className="flex items-center gap-2 text-sm rounded-md py-2 px-4 bg-brand-dark-green text-brand-cream hover:brightness-110"
				>
					<PlusIcon className="h-5 w-5" />
					<span>Add New School</span>
				</button>
			</div>

			<table className="min-w-full divide-y divide-gray-200">
				<thead className="bg-gray-50">
					<tr>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Name
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Address
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Delivery Days
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Classes
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Status
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Actions
						</th>
					</tr>
				</thead>
				<tbody className="bg-white divide-y divide-gray-200">
					{schools.map((school) => (
						<tr key={school.id}>
							<td className="px-6 py-4 whitespace-nowrap">{school.name}</td>
							<td className="px-6 py-4 whitespace-nowrap">{school.address}</td>
							<td className="px-6 py-4 whitespace-nowrap">{school.deliveryDays}</td>
							<td className="px-6 py-4 whitespace-nowrap">{school.classes.length} classes</td>
							<td className="px-6 py-4 whitespace-nowrap">
								<span
									className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
										school.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
									}`}
								>
									{school.isActive ? 'Active' : 'Inactive'}
								</span>
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
								<button className="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
								<button className="text-red-600 hover:text-red-900">Delete</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{isAddSchoolModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
					<div className="bg-white p-6 rounded-lg">
						<h2 className="text-xl mb-4">Add New School</h2>
						<form onSubmit={handleSubmitSchool}>
							<input
								type="text"
								name="name"
								value={newSchool.name}
								onChange={handleInputChange}
								placeholder="School Name"
								className="mb-2 p-2 border rounded w-full"
								required
							/>
							<input
								type="text"
								name="address"
								value={newSchool.address}
								onChange={handleInputChange}
								placeholder="Address"
								className="mb-2 p-2 border rounded w-full"
								required
							/>
							<input
								type="text"
								name="deliveryDays"
								value={newSchool.deliveryDays.join(', ')}
								onChange={(e) =>
									setNewSchool((prev) => ({ ...prev, deliveryDays: e.target.value.split(', ') }))
								}
								placeholder="Delivery Days (comma-separated)"
								className="mb-2 p-2 border rounded w-full"
								required
							/>
							{/* TODO: Add input for classes */}
							<div className="flex justify-end gap-2 mt-4">
								<button
									type="button"
									onClick={() => setIsAddSchoolModalOpen(false)}
									className="px-4 py-2 bg-gray-200 rounded"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="px-4 py-2 bg-brand-dark-green text-white rounded"
								>
									Add School
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
