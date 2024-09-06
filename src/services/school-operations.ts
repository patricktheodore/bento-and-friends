import { getFunctions, httpsCallable, HttpsCallableResult, Functions } from 'firebase/functions';
import { FirebaseError } from 'firebase/app';

const functions: Functions = getFunctions();

// Define types for school data
export interface School {
	id: string;
	name: string;
	logo: string;
	address: string;
	contact: string;
	deliveryDays: string;
	isActive: boolean;
}

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

class ApiError extends Error {
	code: string;

	constructor(message: string, code: string) {
		super(message);
		this.code = code;
		this.name = 'ApiError';
	}
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

export const getSchools = async (): Promise<ApiResponse<School[]>> => {
	try {
		const getSchoolsFunction = httpsCallable<void, { schools: School[] }>(functions, 'getSchools');
		const result: HttpsCallableResult<{ schools: School[] }> = await getSchoolsFunction();
		return { success: true, data: result.data.schools };
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
