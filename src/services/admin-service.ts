import { db } from '@/firebase';
import { 
    doc, 
    getDoc, 
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
    searchTerm?: string;
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
            searchTerm = ''
        } = options;

        let ordersQuery;

        if (searchTerm) {
            // Try to search by both orderId
            // First try orderId (exact match)

            if (searchTerm.startsWith('202') || searchTerm.startsWith('ORD')) {
                let formattedSearchTerm = searchTerm.startsWith('ORD') ? searchTerm : `ORD-${searchTerm}`;

                ordersQuery = query(
                    collection(db, 'orders-test2'),
                    where('orderId', '>=', formattedSearchTerm.toUpperCase()),
                    limit(pageSize)
                );
            } else {
                ordersQuery = query(
                    collection(db, 'orders-test2'),
                    where('userEmail', '>=', searchTerm),
                    limit(pageSize)
                );
            }

            let querySnapshot = await getDocs(ordersQuery);
            
            // Process search results
            const orders: OrderRecord[] = [];
            for (const doc of querySnapshot.docs) {
                const orderData = doc.data();
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
                hasMore: false // Search results don't paginate
            };
        } else {
            // Default query - ordered by createdAt descending
            ordersQuery = query(
                collection(db, 'orders-test2'),
                orderBy('createdAt', 'desc'),
                limit(pageSize)
            );
        }

        // Add pagination if lastVisible document is provided
        if (lastVisible && !searchTerm) {
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

    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
};