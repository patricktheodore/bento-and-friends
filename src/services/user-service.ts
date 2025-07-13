import { collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc, startAfter } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Child } from '../models/user.model';

interface FetchUsersResponse {
	users: User[];
	lastVisible: any;
	hasMore: boolean;
}

const serializeUser = (user: User): Record<string, any> => {
	return {
		...user,
		children: user.children.map(serializeChild),
	};
};

const serializeChild = (child: Child): Record<string, any> => {
	return {
		id: child.id,
		name: child.name,
		year: child.year,
		schoolId: child.schoolId || null,
		className: child.className,
		allergens: child.allergens ?? '',
		isTeacher: child.isTeacher,
	};
};

// TODO: rename collections removing '-test' suffix when ready for production

export const updateUserInFirebase = async (user: User): Promise<void> => {
	const userRef = doc(db, 'users-test', user.id);
	const serializedUser = serializeUser(user);
	await setDoc(userRef, serializedUser, { merge: true });
};

export const fetchUsers = async (pageSize: number = 25, lastDoc?: any): Promise<FetchUsersResponse> => {
	try {
		const usersCollection = collection(db, 'users-test');
		let usersQuery = query(usersCollection, orderBy('displayName'), limit(pageSize));

		if (lastDoc) {
			usersQuery = query(usersQuery, startAfter(lastDoc));
		}

		const snapshot = await getDocs(usersQuery);
		const users = snapshot.docs.map(
			(doc) =>
				({
					id: doc.id,
					...doc.data(),
				} as User)
		);

		return {
			users,
			lastVisible: snapshot.docs[snapshot.docs.length - 1],
			hasMore: snapshot.docs.length === pageSize,
		};
	} catch (error) {
		console.error('Error fetching users:', error);
		throw error;
	}
};

export const fetchUserDetails = async (userId: string): Promise<User> => {
	const userDoc = await getDoc(doc(db, 'users-test', userId));
	if (!userDoc.exists()) {
		throw new Error('User not found');
	}
	return {
		id: userDoc.id,
		...userDoc.data(),
	} as User;
};

// Optional: Add a function to fetch school details if needed elsewhere
export const fetchSchoolDetails = async (schoolId: string) => {
	const schoolDoc = await getDoc(doc(db, 'schools-test', schoolId));
	if (!schoolDoc.exists()) {
		throw new Error('School not found');
	}
	return {
		id: schoolDoc.id,
		...schoolDoc.data(),
	};
};
