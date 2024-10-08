import { db } from '../firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

const BLOCKED_DATES_COLLECTION = 'blockedDates';

export const updateBlockedDates = async (dates: Date[]) => {
  try {
    const batch = writeBatch(db);
    const collectionRef = collection(db, BLOCKED_DATES_COLLECTION);

    // First, get all existing documents
    const snapshot = await getDocs(collectionRef);

    // Delete all existing documents
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Add new documents for each date
    dates.forEach((date) => {
      const newDocRef = doc(collectionRef);
      batch.set(newDocRef, { date: date.toISOString() });
    });

    // Commit the batch
    await batch.commit();
  } catch (error) {
    console.error('Error updating blocked dates:', error);
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