import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut as firebaseSignOut,
	onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, db } from '../firebase';
import { User } from '../models/user.model';
import { sendPasswordResetEmail as firebaseSendPasswordResetEmail } from 'firebase/auth';

const functions = getFunctions();

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
		orders: [],
	};

	await setDoc(doc(db, 'users-test2', user.uid), newUser);

    try {
		const sendWelcomeEmail = httpsCallable(functions, 'sendWelcomeEmail');
		const result = await sendWelcomeEmail({
			email: email,
			displayName: displayName
		});
		
		console.log('Welcome email sent successfully:', result.data);
	} catch (error) {
		console.error('Failed to send welcome email:', error);
	}

	return newUser;
};

export const signIn = async (email: string, password: string): Promise<User> => {
	const userCredential = await signInWithEmailAndPassword(auth, email, password);
	const user = userCredential.user;

	const userDoc = await getDoc(doc(db, 'users-test2', user.uid));
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
                    const userDoc = await getDoc(doc(db, 'users-test2', user.uid));
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
