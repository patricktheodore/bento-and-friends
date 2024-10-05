import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust the import path as needed

export const getMealsBetweenDates = async (startDate: Date, endDate: Date, schoolId?: string) => {
  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);

  let q = query(
    collection(db, 'meals'),
    where('deliveryDate', '>=', startTimestamp),
    where('deliveryDate', '<=', endTimestamp),
    orderBy('deliveryDate')
  );

  if (schoolId) {
    q = query(q, where('schoolId', '==', schoolId));
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};