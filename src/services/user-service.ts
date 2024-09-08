import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Child } from '../models/user.model';

const serializeUser = (user: User): Record<string, any> => {
  return {
    ...user,
    children: user.children.map(serializeChild)
  };
};

const serializeChild = (child: Child): Record<string, any> => {
  return {
    id: child.id,
    name: child.name,
    year: child.year,
    schoolId: child.school,
    classId: child.className
  };
};

export const updateUserInFirebase = async (user: User): Promise<void> => {
  const userRef = doc(db, 'users', user.id);
  const serializedUser = serializeUser(user);
  await setDoc(userRef, serializedUser, { merge: true });
};