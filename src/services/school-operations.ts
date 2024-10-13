import { getFunctions, httpsCallable, HttpsCallableResult, Functions } from 'firebase/functions';
import { FirebaseError } from 'firebase/app';
import { collection, getDocs } from 'firebase/firestore';
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
		const addSchoolFunction = httpsCallable<Omit<School, 'id'>, School>(functions, 'addSchool');
		const result: HttpsCallableResult<School> = await addSchoolFunction(schoolData);
		return { success: true, data: result.data };
	} catch (error) {
		return { success: false, error: handleApiError(error) };
	}
};

export const updateSchool = async (
	schoolId: string,
	updateData: Partial<Omit<School, 'id'>>
): Promise<ApiResponse<School>> => {
	try {
		const updateSchoolFunction = httpsCallable<{ id: string } & Partial<Omit<School, 'id'>>, School>(
			functions,
			'updateSchool'
		);
		const result: HttpsCallableResult<School> = await updateSchoolFunction({ id: schoolId, ...updateData });
		return { success: true, data: result.data };
	} catch (error) {
		return { success: false, error: handleApiError(error) };
	}
};

export const deleteSchool = async (schoolId: string): Promise<ApiResponse<{ id: string }>> => {
	try {
		const deleteSchoolFunction = httpsCallable<{ id: string }, { id: string }>(functions, 'deleteSchool');
		const result: HttpsCallableResult<{ id: string }> = await deleteSchoolFunction({ id: schoolId });
		return { success: true, data: result.data };
	} catch (error) {
		return { success: false, error: handleApiError(error) };
	}
};



// Function to get all schools
export const getSchools = async (): Promise<{ success: boolean; data?: School[]; error?: string }> => {
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
