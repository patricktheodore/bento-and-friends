import { db } from '@/firebase';
import { doc, getDoc, getDocs, query, where, collection } from 'firebase/firestore';
import { MealRecord, OrderRecord } from '../models/order.model';

export const fetchOrderDetails = async (orderId: string): Promise<OrderRecord> => {
    try {
        const orderRef = doc(db, 'order-test2', orderId);
        const orderDoc = await getDoc(orderRef);
    
        if (!orderDoc.exists()) {
            throw new Error(`Order with ID ${orderId} does not exist.`);
        }
    
        const orderData = orderDoc.data();
        const meals: MealRecord[] = await fetchMealsById(orderData.mealIds || []);
    
        return {
            orderId: orderData.orderId,
            userId: orderData.userId,
            meals,
            pricing: orderData.pricing,
            payment: orderData.payment,
            itemCount: orderData.itemCount || 0,
            totalAmount: orderData.totalAmount || 0,
            status: orderData.status || 'pending',
            createdAt: orderData.createdAt,
            updatedAt: orderData.updatedAt || new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error fetching order details:', error);
        throw error;
    }
}

export const fetchMealsById = async (mealIds: string[]): Promise<MealRecord[]> => {
  try {
    const meals: MealRecord[] = [];
    
    // Fetch meals in batches (Firestore has a limit of 10 items per 'in' query)
    const batchSize = 10;
    
    for (let i = 0; i < mealIds.length; i += batchSize) {
      const batch = mealIds.slice(i, i + batchSize);
      const mealsQuery = query(
        collection(db, 'meals-test2'),
        where('mealId', 'in', batch)
      );
      
      const mealsSnapshot = await getDocs(mealsQuery);
      
      mealsSnapshot.docs.forEach(doc => {
        const mealData = doc.data();
        const meal: MealRecord = {
          mealId: mealData.mealId,
          orderId: mealData.orderId,
          userId: mealData.userId,
          deliveryDate: mealData.deliveryDate,
          schoolId: mealData.schoolId,
          schoolName: mealData.schoolName,
          schoolAddress: mealData.schoolAddress,
          childId: mealData.childId,
          childName: mealData.childName,
          mainId: mealData.mainId,
          mainName: mealData.mainName,
          addOns: mealData.addOns || [],
          fruitId: mealData.fruitId || null,
          fruitName: mealData.fruitName || null,
          sideId: mealData.sideId || null,
          sideName: mealData.sideName || null,
          totalAmount: parseFloat(mealData.totalAmount) || 0,
          orderedOn: mealData.orderedOn,
          createdAt: mealData.createdAt,
          updatedAt: mealData.updatedAt || new Date().toISOString()
        };

        meals.push(meal);
      });
    }
    
    return meals;
    
  } catch (error) {
    console.error('Error fetching meals by ID:', error);
    throw error;
  }
}