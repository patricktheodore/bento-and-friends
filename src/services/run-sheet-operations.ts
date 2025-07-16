import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { MealRecord } from '@/models/order.model';

export interface MealWithId extends MealRecord {
  id: string;
}

export const getMealsBetweenDates = async (
  startDate: Date, 
  endDate: Date
): Promise<MealWithId[]> => {
  // Format dates as YYYY-MM-DD strings to match your deliveryDate format
  const startDateString = startDate.toISOString().split('T')[0];
  const endDateString = endDate.toISOString().split('T')[0];

  const q = query(
    collection(db, 'meals-test2'),
    where('deliveryDate', '>=', startDateString),
    where('deliveryDate', '<=', endDateString),
    orderBy('deliveryDate')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as MealWithId[];
};

export const getMealsByDateRange = async (
  startDate: string, 
  endDate: string
): Promise<MealWithId[]> => {
  const q = query(
    collection(db, 'meals-test2'),
    where('deliveryDate', '>=', startDate),
    where('deliveryDate', '<=', endDate),
    orderBy('deliveryDate')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as MealWithId[];
};

export const getMealsBySchool = async (
  schoolId: string,
  startDate?: string,
  endDate?: string
): Promise<MealWithId[]> => {
  let q = query(
    collection(db, 'meals-test2'),
    where('schoolId', '==', schoolId),
    orderBy('deliveryDate')
  );

  if (startDate) {
    q = query(q, where('deliveryDate', '>=', startDate));
  }
  
  if (endDate) {
    q = query(q, where('deliveryDate', '<=', endDate));
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as MealWithId[];
};

export const getMealsByChild = async (
  childId: string,
  startDate?: string,
  endDate?: string
): Promise<MealWithId[]> => {
  let q = query(
    collection(db, 'meals-test2'),
    where('childId', '==', childId),
    orderBy('deliveryDate')
  );

  if (startDate) {
    q = query(q, where('deliveryDate', '>=', startDate));
  }
  
  if (endDate) {
    q = query(q, where('deliveryDate', '<=', endDate));
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as MealWithId[];
};

export const getMealsPlacedAfterDate = async (startDate: Date, deliveryStartDate: Date, deliveryEndDate: Date): Promise<MealWithId[]> => {
  try {
    const mealsRef = collection(db, 'meals-test2');
    
    // Convert dates to ISO strings for comparison
    // startDate is already in the user's local timezone (Perth), toISOString() converts to UTC
    // This matches the stored orderedOn field which should be in UTC
    const startDateISOString = startDate.toISOString();
    const deliveryStartISOString = deliveryStartDate.toISOString();
    const deliveryEndISOString = deliveryEndDate.toISOString();
    
    // Query meals ordered after the start date and within the delivery date range
    // Note: This requires a composite index on (orderedOn, deliveryDate)
    const q = query(
      mealsRef,
      where('orderedOn', '>=', startDateISOString),
      where('deliveryDate', '>=', deliveryStartISOString),
      where('deliveryDate', '<=', deliveryEndISOString),
      orderBy('orderedOn', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const meals: MealWithId[] = [];
    
    querySnapshot.forEach((doc) => {
      const mealData = doc.data();
      meals.push({
        id: doc.id,
        ...mealData
      } as MealWithId);
    });
    
    return meals;
  } catch (error) {
    console.error('Error fetching meals placed after date:', error);
    
    throw error;
  }
};
