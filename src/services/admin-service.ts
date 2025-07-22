import { db } from '@/firebase';
import { 
    getDocs, 
    query, 
    where, 
    collection, 
    orderBy, 
    limit, 
    startAfter,
    QueryDocumentSnapshot,
    DocumentData 
} from 'firebase/firestore';
import { MealRecord, OrderRecord } from '../models/order.model';
import { fetchMealsById } from './order-service';

export interface PaginatedOrdersResponse {
    orders: OrderRecord[];
    lastVisible: QueryDocumentSnapshot<DocumentData> | null;
    hasMore: boolean;
}

export interface FetchOrdersOptions {
    pageSize?: number;
    lastVisible?: QueryDocumentSnapshot<DocumentData> | null;
    searchByOrderId?: string;
    searchByEmail?: string;
}

/**
 * Fetch orders with pagination support, ordered by createdAt descending
 * @param options - Configuration options for fetching orders
 * @returns Promise<PaginatedOrdersResponse> - Orders with pagination info
 */
export const fetchOrders = async (options: FetchOrdersOptions = {}): Promise<PaginatedOrdersResponse> => {
    try {
        const {
            pageSize = 25,
            lastVisible = null,
            searchByOrderId = '',
            searchByEmail = ''
        } = options;

        let ordersQuery;
        const isSearching = searchByOrderId.trim() || searchByEmail.trim();

        if (isSearching) {
            if (searchByOrderId.trim()) {
                // Search by Order ID (exact match)
                let formattedOrderId = searchByOrderId.trim().toUpperCase();
                
                // Add ORD- prefix if not present
                if (!formattedOrderId.startsWith('ORD-')) {
                    formattedOrderId = `ORD-${formattedOrderId}`;
                }

                ordersQuery = query(
                    collection(db, 'orders-test2'),
                    where('orderId', '==', formattedOrderId),
                    limit(pageSize)
                );
            } else if (searchByEmail.trim()) {
                // Search by Email (starts with for better matching)
                const emailTerm = searchByEmail.trim().toLowerCase();
                ordersQuery = query(
                    collection(db, 'orders-test2'),
                    where('userEmail', '>=', emailTerm),
                    where('userEmail', '<=', emailTerm + '\uf8ff'),
                    orderBy('userEmail'),
                    limit(pageSize)
                );
            }

            const querySnapshot = await getDocs(ordersQuery!);
            
            // Process search results
            const orders: OrderRecord[] = [];
            for (const doc of querySnapshot.docs) {
                const orderData = doc.data();
                
                // Additional filtering for email search to ensure it contains the search term
                if (searchByEmail.trim()) {
                    const userEmail = orderData.userEmail?.toLowerCase() || '';
                    if (!userEmail.includes(searchByEmail.trim().toLowerCase())) {
                        continue;
                    }
                }
                
                const meals: MealRecord[] = await fetchMealsById(orderData.mealIds || []);

                const order: OrderRecord = {
                    orderId: orderData.orderId,
                    userId: orderData.userId,
                    userEmail: orderData.userEmail,
                    meals,
                    pricing: orderData.pricing,
                    payment: orderData.payment,
                    itemCount: orderData.itemCount || 0,
                    totalAmount: orderData.totalAmount || 0,
                    status: orderData.status || 'pending',
                    createdAt: orderData.createdAt,
                    updatedAt: orderData.updatedAt || new Date().toISOString(),
                };
                orders.push(order);
            }

            return {
                orders,
                lastVisible: querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null,
                hasMore: false // Search results don't paginate for now
            };
        } else {
            // Default query - ordered by createdAt descending
            ordersQuery = query(
                collection(db, 'orders-test2'),
                orderBy('createdAt', 'desc'),
                limit(pageSize)
            );

            // Add pagination if lastVisible document is provided
            if (lastVisible) {
                ordersQuery = query(ordersQuery, startAfter(lastVisible));
            }

            const querySnapshot = await getDocs(ordersQuery);
            const orders: OrderRecord[] = [];

            // Process each order document
            for (const doc of querySnapshot.docs) {
                const orderData = doc.data();
                
                // Fetch associated meals
                const meals: MealRecord[] = await fetchMealsById(orderData.mealIds || []);

                const order: OrderRecord = {
                    orderId: orderData.orderId,
                    userId: orderData.userId,
                    userEmail: orderData.userEmail,
                    meals,
                    pricing: orderData.pricing,
                    payment: orderData.payment,
                    itemCount: orderData.itemCount || 0,
                    totalAmount: orderData.totalAmount || 0,
                    status: orderData.status || 'pending',
                    createdAt: orderData.createdAt,
                    updatedAt: orderData.updatedAt || new Date().toISOString(),
                };

                orders.push(order);
            }

            // Determine pagination info
            const newLastVisible = querySnapshot.docs.length > 0 
                ? querySnapshot.docs[querySnapshot.docs.length - 1] 
                : null;
            
            const hasMore = querySnapshot.docs.length === pageSize;

            return {
                orders,
                lastVisible: newLastVisible,
                hasMore
            };
        }

    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
};