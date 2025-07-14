import { doc, addDoc, updateDoc, getDocs, collection } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { db } from '../firebase';
import { School } from '../models/school.model';
import { User, Child } from '../models/user.model';

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

export interface SchoolChildrenData {
	childrenCount: number;
	users: Array<{
		userId: string;
		userName: string;
		userEmail: string;
		children: Array<{
			id: string;
			name: string;
			year?: string;
			className?: string;
			isTeacher: boolean;
		}>;
	}>;
}

export interface SchoolEnrollmentData {
	[schoolId: string]: SchoolChildrenData;
}

export const handleApiError = (error: unknown): string => {
	if (error instanceof FirebaseError) {
		if (error.code === 'functions/permission-denied') {
			return 'You do not have permission to perform this action.';
		} else {
			return error.message;
		}
	} else if (error instanceof Error) {
		return error.message;
	} else {
		console.error('Unexpected error:', error);
		return 'An unexpected error occurred';
	}
};

export const addSchool = async (schoolData: Omit<School, 'id'>): Promise<ApiResponse<School>> => {
	try {
		const docRef = await addDoc(collection(db, 'schools-test'), schoolData);
		const newSchool = { id: docRef.id, ...schoolData } as School;
		return { success: true, data: newSchool };
	} catch (error) {
		return { success: false, error: handleApiError(error) };
	}
};

export const updateSchool = async (
	schoolId: string,
	updateData: Partial<Omit<School, 'id'>>
): Promise<ApiResponse<School>> => {
	try {
		const schoolRef = doc(db, 'schools-test', schoolId);
		await updateDoc(schoolRef, updateData);
		// You'd need to fetch the updated doc or construct it
		return { success: true, data: { id: schoolId, ...updateData } as School };
	} catch (error) {
		return { success: false, error: handleApiError(error) };
	}
};

// Function to get all schools
export const getSchools = async (): Promise<{ success: boolean; data?: School[]; error?: string }> => {
	try {
		const schoolsCollection = collection(db, 'schools-test');
		const schoolSnapshot = await getDocs(schoolsCollection);
		const schoolList = schoolSnapshot.docs.map(
			(doc) =>
				({
					id: doc.id,
					...doc.data(),
				} as School)
		);
		return { success: true, data: schoolList };
	} catch (error) {
		console.error('Error getting schools: ', error);
		return { success: false, error: (error as Error).message };
	}
};

// Function to get children enrollment data for all schools
export const getSchoolEnrollmentData = async (): Promise<ApiResponse<SchoolEnrollmentData>> => {
	try {
		const usersCollection = collection(db, 'users-test2');
		const usersSnapshot = await getDocs(usersCollection);
		
		const enrollmentData: SchoolEnrollmentData = {};
		
		usersSnapshot.docs.forEach((doc) => {
			const userData = doc.data() as User;
			const userId = doc.id;
			
			// Skip users without children
			if (!userData.children || userData.children.length === 0) {
				return;
			}
			
			// Group children by school
			const childrenBySchool: { [schoolId: string]: Child[] } = {};
			
			userData.children.forEach((child: Child) => {
				if (child.schoolId) {
					if (!childrenBySchool[child.schoolId]) {
						childrenBySchool[child.schoolId] = [];
					}
					childrenBySchool[child.schoolId].push(child);
				}
			});
			
			// Add to enrollment data
			Object.entries(childrenBySchool).forEach(([schoolId, children]) => {
				if (!enrollmentData[schoolId]) {
					enrollmentData[schoolId] = {
						childrenCount: 0,
						users: []
					};
				}
				
				enrollmentData[schoolId].childrenCount += children.length;
				enrollmentData[schoolId].users.push({
					userId,
					userName: userData.displayName || 'Unknown User',
					userEmail: userData.email || '',
					children: children.map(child => ({
						id: child.id,
						name: child.name,
						year: child.year,
						className: child.className,
						isTeacher: child.isTeacher || false
					}))
				});
			});
		});
		
		return { success: true, data: enrollmentData };
	} catch (error) {
		console.error('Error getting school enrollment data: ', error);
		return { success: false, error: handleApiError(error) };
	}
};

// Function to get enrollment data for a specific school
export const getSchoolEnrollmentDataById = async (schoolId: string): Promise<ApiResponse<SchoolChildrenData>> => {
	try {
		const allEnrollmentData = await getSchoolEnrollmentData();
		
		if (!allEnrollmentData.success || !allEnrollmentData.data) {
			return { success: false, error: allEnrollmentData.error };
		}
		
		const schoolData = allEnrollmentData.data[schoolId] || {
			childrenCount: 0,
			users: []
		};
		
		return { success: true, data: schoolData };
	} catch (error) {
		return { success: false, error: handleApiError(error) };
	}
};

export const updateSchoolValidDates = async (
	schoolId: string,
	validDates: Date[]
): Promise<ApiResponse<string[]>> => {
	try {
		const schoolRef = doc(db, 'schools-test', schoolId);
        // Convert Date objects to ISO strings
        const validDatesStrings = validDates.map((date) => date.toISOString()); // Format as YYYY-MM-DD
		await updateDoc(schoolRef, { validDates: validDatesStrings });
		return { success: true, data: validDatesStrings };
	} catch (error) {
		return { success: false, error: handleApiError(error) };
	}
};

export const updateSchoolMenuItems = async (
	schoolId: string,
	menuItemIds: string[]
): Promise<ApiResponse<string[]>> => {
	try {
		const schoolRef = doc(db, 'schools-test', schoolId);
		await updateDoc(schoolRef, { menuItems: menuItemIds });
		return { success: true, data: menuItemIds };
	} catch (error) {
		return { success: false, error: handleApiError(error) };
	}
};