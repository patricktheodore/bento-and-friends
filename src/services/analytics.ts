import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, getCountFromServer } from 'firebase/firestore';

interface DailyAnalytics {
  date: string;
  orderCount: number;
  mealCount: number;
  revenue: number;
  userCount: number;
  schoolCount: number;
  popularItems: { [key: string]: { count: number; name: string } };
}

interface CumulativeAnalytics {
  orderCount: number;
  mealCount: number;
  revenue: number;
  userCount: number;
  schoolCount: number;
}

export const getAnalytics = async (date: string) => {
  const analyticsRef = doc(db, 'dailyAnalytics', date);
  const analyticsSnap = await getDoc(analyticsRef);

  if (analyticsSnap.exists()) {
    const data = analyticsSnap.data() as DailyAnalytics;
    const cumulativeRef = doc(db, 'cumulativeAnalytics', 'totals');
    const cumulativeSnap = await getDoc(cumulativeRef);
    const cumulativeData = cumulativeSnap.data() as CumulativeAnalytics;

    // Calculate derived metrics
    const averageMealsPerOrder = data.orderCount > 0 ? data.mealCount / data.orderCount : 0;
    const averagePricePerOrder = data.orderCount > 0 ? data.revenue / data.orderCount : 0;
    const averagePricePerMeal = data.mealCount > 0 ? data.revenue / data.mealCount : 0;

    // Get the current user count
    const usersCollection = collection(db, 'users');
    const userCountSnapshot = await getCountFromServer(usersCollection);
    const currentUserCount = userCountSnapshot.data().count;

    return {
      date: data.date,
      dailyOrderCount: data.orderCount,
      dailyMealCount: data.mealCount,
      dailyRevenue: data.revenue,
      averageMealsPerOrder,
      averagePricePerOrder,
      averagePricePerMeal,
      totalUsers: currentUserCount,
      totalOrders: cumulativeData?.orderCount || 0,
      totalMeals: cumulativeData?.mealCount || 0,
      totalRevenue: cumulativeData?.revenue || 0,
    };
  } else {
    throw new Error('Analytics data not found for the specified date');
  }
};

export const getAllDailyAnalytics = async (days: number = 90) => {
  const analyticsRef = collection(db, 'dailyAnalytics');
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const q = query(
    analyticsRef,
    where('date', '>=', startDate.toISOString().split('T')[0]),
    where('date', '<=', endDate.toISOString().split('T')[0]),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    date: doc.id,
    ...doc.data()
  })) as DailyAnalytics[];
};

export const getCumulativeAnalytics = async () => {
    const cumulativeRef = doc(db, 'cumulativeAnalytics', 'totals');
    const cumulativeSnap = await getDoc(cumulativeRef);
    
    if (cumulativeSnap.exists()) {
      const cumulativeData = cumulativeSnap.data() as CumulativeAnalytics;
  
      // Get the current user count
      const usersCollection = collection(db, 'users');
      const userCountSnapshot = await getCountFromServer(usersCollection);
      const currentUserCount = userCountSnapshot.data().count;
  
      return {
        ...cumulativeData,
        userCount: currentUserCount  // Override the userCount with the current count
      };
    } else {
      throw new Error('Cumulative analytics data not found');
    }
  };
  

export const getOrdersOverTime = async (days: number = 30) => {
  const dailyAnalytics = await getAllDailyAnalytics(days);
  return dailyAnalytics.map(day => ({
    date: day.date,
    orders: day.orderCount
  }));
};

export const calculateMetrics = (cumulativeAnalytics: CumulativeAnalytics) => {
    return {
      averageMealsPerOrder: cumulativeAnalytics.mealCount / cumulativeAnalytics.orderCount,
      averageRevenuePerOrder: cumulativeAnalytics.revenue / cumulativeAnalytics.orderCount,
      averageMealCost: cumulativeAnalytics.revenue / cumulativeAnalytics.mealCount,
      totalOrders: cumulativeAnalytics.orderCount,
      totalMeals: cumulativeAnalytics.mealCount,
      totalRevenue: cumulativeAnalytics.revenue,
      totalUsers: cumulativeAnalytics.userCount,  // Include total users in the metrics
    };
  };