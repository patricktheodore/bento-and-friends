import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { User, CreateUserData } from '../types/user';
import { db } from '../firebase';
import { User as FirebaseUser } from 'firebase/auth';

export const createUserDocument = async (user: FirebaseUser, additionalData: Partial<CreateUserData> = {}): Promise<void> => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);

  const userData: CreateUserData = {
    displayName: user.displayName,
    email: user.email,
    isAdmin: false,  // default to false, can be changed manually for admin users
    ...additionalData
  };

  try {
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating user document", error);
  }
};

export const updateUserLoginTimestamp = async (userId: string): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  try {
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating user login time", error);
  }
};

export const getUserData = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, 'users', userId);
  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return { uid: userSnap.id, ...userSnap.data() } as User;
    }
  } catch (error) {
    console.error("Error fetching user data", error);
  }
  return null;
};