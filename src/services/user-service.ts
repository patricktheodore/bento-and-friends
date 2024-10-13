import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Child } from '../models/user.model';
import { Order } from '@/models/order.model';

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
    school: child.school,
    className: child.className,
    allergens: child.allergens ?? '',
    isTeacher: child.isTeacher
  };
};

export const updateUserInFirebase = async (user: User): Promise<void> => {
  const userRef = doc(db, 'users', user.id);
  const serializedUser = serializeUser(user);
  await setDoc(userRef, serializedUser, { merge: true });
};

export const fetchOrderDetails = async (orderId: string): Promise<Order> => {
  const orderRef = doc(db, 'orders', orderId);
  const orderDoc = await getDoc(orderRef);
  
  if (orderDoc.exists()) {
    return { id: orderDoc.id, ...orderDoc.data() } as Order;
  } else {
    throw new Error('Order not found');
  }
};

export const fetchAllOrders = async (userId: string): Promise<Order[]> => {
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  
  const orders: Order[] = [];
  querySnapshot.forEach((doc) => {
    orders.push({ id: doc.id, ...doc.data() } as Order);
  });
  
  return orders;
};