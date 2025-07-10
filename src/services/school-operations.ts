import { doc, addDoc, updateDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { getFunctions, httpsCallable, HttpsCallableResult, Functions } from 'firebase/functions';
import { FirebaseError } from 'firebase/app';
import { db } from '../firebase';
import { School } from '../models/school.model';

const functions: Functions = getFunctions();

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

const handleApiError = (error: unknown): string => {
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
					// Ensure validDates are converted to Date objects if they're stored as strings/timestamps
					validDates: doc.data().validDates ? doc.data().validDates.map((date: any) => {
						if (date && typeof date.toDate === 'function') {
							return date.toDate(); // Firestore Timestamp
						} else if (date && typeof date === 'string') {
							return new Date(date);
						}
						return date;
					}) : []
				} as School)
		);
		return { success: true, data: schoolList };
	} catch (error) {
		console.error('Error getting schools: ', error);
		return { success: false, error: (error as Error).message };
	}
};

export const updateSchoolValidDates = async (
	schoolId: string,
	validDates: Date[]
): Promise<ApiResponse<Date[]>> => {
	try {
		const schoolRef = doc(db, 'schools-test', schoolId);
		await updateDoc(schoolRef, { validDates });
		return { success: true, data: validDates };
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
