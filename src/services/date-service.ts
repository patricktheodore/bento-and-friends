
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';

const BLOCKED_DATES_COLLECTION = 'blockedDates';

export const addBlockedDate = async (date: Date) => {
  try {
    await addDoc(collection(db, BLOCKED_DATES_COLLECTION), {
      date: date.toISOString(),
    });
  } catch (error) {
    console.error('Error adding blocked date:', error);
    throw error;
  }
};

export const removeBlockedDate = async (date: Date) => {
  try {
    const q = query(
      collection(db, BLOCKED_DATES_COLLECTION),
      where('date', '==', date.toISOString())
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
  } catch (error) {
    console.error('Error removing blocked date:', error);
    throw error;
  }
};

export const getBlockedDates = async (): Promise<string[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, BLOCKED_DATES_COLLECTION));
    return querySnapshot.docs.map(doc => doc.data().date);
  } catch (error) {
    console.error('Error getting blocked dates:', error);
    throw error;
  }
};