import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface OrderDetail {
  id: string;
  customOrderNumber: string;
  createdAt: any;
  status: string;
  total: number;
  finalTotal: number;
  originalTotal: number;
  bundleDiscount: number;
  couponDiscount: number;
  meals: {
    id: string;
    main: { display: string };
    addOns: Array<{ display: string }>;
    child: { name: string };
    orderDate: string;
    total: number;
  }[];
}

export const fetchOrderDetails = async (orderId: string): Promise<OrderDetail | null> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      return null;
    }

    return {
      id: orderDoc.id,
      ...orderDoc.data()
    } as OrderDetail;
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw new Error('Failed to fetch order details');
  }
};