import { Coupon } from '@/models/user.model';

export interface Cart {
	meals: any[];
	total: number;
}

export interface DiscountCalculation {
	bundleDiscountAmount: number;
	bundleDiscountPercentage: number;
	bundleDiscountedTotal: number;
	couponDiscountAmount: number;
	finalTotal: number;
	totalDiscountPercentage: number;
}

/**
 * Calculate bundle discount rate based on meal count
 */
export const calculateBundleDiscountRate = (mealCount: number): number => {
	if (mealCount >= 5) return 0.2;
	if (mealCount >= 3) return 0.1;
	if (mealCount >= 2) return 0.05;
	return 0;
};

/**
 * Calculate all discount amounts and final totals
 */
export const calculateDiscounts = (cart: Cart | null, appliedCoupon: Coupon | null = null): DiscountCalculation => {
	if (!cart) {
		return {
			bundleDiscountAmount: 0,
			bundleDiscountPercentage: 0,
			bundleDiscountedTotal: 0,
			couponDiscountAmount: 0,
			finalTotal: 0,
			totalDiscountPercentage: 0,
		};
	}

	const mealCount = cart.meals.length;
	const bundleDiscountRate = calculateBundleDiscountRate(mealCount);

	// Calculate bundle discount
	const bundleDiscountAmount = cart.total * bundleDiscountRate;
	const bundleDiscountPercentage = bundleDiscountRate * 100;
	const bundleDiscountedTotal = cart.total - bundleDiscountAmount;

	// Calculate coupon discount
	let couponDiscountAmount = 0;
	if (appliedCoupon) {
		if (appliedCoupon.discountType === 'percentage') {
			couponDiscountAmount = bundleDiscountedTotal * (appliedCoupon.discountAmount / 100);
		} else {
			couponDiscountAmount = Math.min(appliedCoupon.discountAmount, bundleDiscountedTotal);
		}
	}

	// Calculate final totals
	const totalDiscountAmount = bundleDiscountAmount + couponDiscountAmount;
	const finalTotal = Math.max(0, bundleDiscountedTotal - couponDiscountAmount);
	const totalDiscountPercentage = (totalDiscountAmount / cart.total) * 100;

	return {
		bundleDiscountAmount,
		bundleDiscountPercentage,
		bundleDiscountedTotal,
		couponDiscountAmount,
		finalTotal,
		totalDiscountPercentage,
	};
};
