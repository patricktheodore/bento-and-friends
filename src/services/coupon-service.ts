import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';
import { Coupon } from '../models/user.model';

export const getCoupons = async (): Promise<{ success: boolean; data?: Coupon[]; error?: string }> => {
	try {
		const couponsCollection = collection(db, 'coupon');
		const couponsSnapshot = await getDocs(couponsCollection);
		const coupons = couponsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Coupon));
		return { success: true, data: coupons };
	} catch (error) {
		console.error('Error fetching coupons: ', error);
		return { success: false, error: (error as Error).message };
	}
};

export const addOrUpdateCoupon = async (
	coupon: Coupon
): Promise<{ success: boolean; data?: Coupon; error?: string }> => {
	try {
		const couponRef = doc(db, 'coupon', coupon.id);
		await setDoc(couponRef, coupon, { merge: true });
		return { success: true, data: coupon };
	} catch (error) {
		console.error('Error adding/updating coupon: ', error);
		return { success: false, error: (error as Error).message };
	}
};

export const deleteCoupon = async (couponId: string): Promise<{ success: boolean; error?: string }> => {
	try {
		const couponRef = doc(db, 'coupon', couponId);
		await deleteDoc(couponRef);
		return { success: true };
	} catch (error) {
		console.error('Error deleting coupon: ', error);
		return { success: false, error: (error as Error).message };
	}
};

export const validateCoupon = async (code: string): Promise<{ success: boolean; data?: Coupon; error?: string }> => {
	try {
		console.log('Validating coupon with code:', code);

		// First, try to get the coupon by using the code as the document ID
		const couponDocRef = doc(db, 'coupon', code);
		const couponDocSnap = await getDoc(couponDocRef);

		let couponData: Coupon | undefined;

		if (couponDocSnap.exists()) {
			console.log('Coupon found by document ID');
			couponData = couponDocSnap.data() as Coupon;
		} else {
			console.log('Coupon not found by document ID, searching by code field');
			// If not found, query the 'coupon' collection for a document with a matching 'code' field
			const couponQuery = query(collection(db, 'coupon'), where('code', '==', code));
			const querySnapshot = await getDocs(couponQuery);

			if (!querySnapshot.empty) {
				couponData = querySnapshot.docs[0].data() as Coupon;
				console.log('Coupon found by code field');
			}
		}

		if (couponData) {
			console.log('Coupon data:', couponData);
			const now = new Date();
			const expiryDate = new Date(couponData.expiryDate);

			if (expiryDate < now) {
				console.log('Coupon has expired');
				return { success: false, error: 'Coupon has expired' };
			}

			if (!couponData.isActive) {
				console.log('Coupon is not active');
				return { success: false, error: 'Coupon is not active' };
			}

			return { success: true, data: couponData };
		} else {
			console.log('Coupon not found');
			return { success: false, error: 'Invalid coupon code' };
		}
	} catch (error) {
		console.error('Error validating coupon:', error);
		return { success: false, error: 'An error occurred while validating the coupon' };
	}
};
