import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut as firebaseSignOut,
	onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User } from '../models/user.model';
import { sendPasswordResetEmail as firebaseSendPasswordResetEmail } from 'firebase/auth';

export const sendPasswordResetEmail = (email: string) => {
	return firebaseSendPasswordResetEmail(auth, email);
};

export const signUp = async (email: string, password: string, displayName: string): Promise<User> => {
	const userCredential = await createUserWithEmailAndPassword(auth, email, password);
	const user = userCredential.user;

	const newUser: User = {
		id: user.uid,
		email: user.email!,
		displayName,
		isAdmin: false,
		activeCoupons: [],
		children: [],
		orderHistory: [],
	};

	await setDoc(doc(db, 'users', user.uid), newUser);

	return newUser;
};

export const signIn = async (email: string, password: string): Promise<User> => {
	const userCredential = await signInWithEmailAndPassword(auth, email, password);
	const user = userCredential.user;

	const userDoc = await getDoc(doc(db, 'users', user.uid));
	const userData = userDoc.data() as User;

	return userData;
};

export const signOut = () => firebaseSignOut(auth);

export const getCurrentUser = (): Promise<User | null> => {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(
            auth,
            async (user) => {
                unsubscribe();
                if (user) {
                    const userDoc = await getDoc(doc(db, 'users-test', user.uid));
                    const userData = userDoc.data() as User;
                    if (userData) {
                        userData.id = userDoc.id; // Assign the doc.id to user.id
                    }
                    resolve(userData);
                } else {
                    resolve(null);
                }
            },
            reject
        );
    });
};
