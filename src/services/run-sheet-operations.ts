import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust the import path as needed

export const getMealsBetweenDates = async (startDate: Date, endDate: Date, schoolId?: string) => {
  // Set the time to the start of the day for the start date
  const startOfDay = new Date(startDate);
  startOfDay.setHours(0, 0, 0, 0);
  const startTimestamp = Timestamp.fromDate(startOfDay);

  // Set the time to the end of the day for the end date
  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);
  const endTimestamp = Timestamp.fromDate(endOfDay);

  let q = query(
    collection(db, 'meals'),
    where('deliveryDate', '>=', startTimestamp),
    where('deliveryDate', '<=', endTimestamp),
    orderBy('deliveryDate')
  );

  if (schoolId) {
    q = query(q, where('school.id', '==', schoolId));
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};