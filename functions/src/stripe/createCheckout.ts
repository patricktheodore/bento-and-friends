import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(functions.config().stripe.secret_key, {
	apiVersion: '2024-06-20',
});

interface CheckoutData {
	lineItems: any[];
	returnUrl: string;
	customerId?: string;
	customerEmail: string;
	couponCode?: string;
	discountAmount?: number;
	cartData?: any;
}

interface OptimizedOrderData {
	orderId: string;
	userId: string;
    stripeSessionId: string;

	meals: Array<{
		id: string;

		main: {
			id: string;
			display: string;
			price: number;
		};
		addOns: Array<{
			id: string;
			display: string;
			price: number;
		}>;

        fruit?: {
            id: string;
            display: string;
        }

        probiotic?: {
            id: string;
            display: string;
        };

		child: {
			id: string;
			name: string;
		};

		school: {
			id: string;
			name: string;
			address: string;
		};

		orderDate: string;
		total: number;
	}>;

	pricing: {
		subtotal: number;
		finalTotal: number;
		appliedCoupon?: {
			code: string;
			discountAmount: number;
		};
	};

	status: 'pending' | 'completed' | 'failed';
	createdAt: string;
	expiresAt: string;
}

export const createCheckout = functions.https.onCall(async (data: CheckoutData, context) => {
	if (!context.auth) {
		throw new functions.https.HttpsError(
			'unauthenticated',
			'User must be authenticated to create checkout session.'
		);
	}

	const userId = context.auth.uid;
	const { lineItems, returnUrl, customerId, customerEmail, couponCode, discountAmount, cartData } = data;
    console.log(cartData);

	if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
		throw new functions.https.HttpsError('invalid-argument', 'Valid lineItems array is required');
	}

	if (!returnUrl || typeof returnUrl !== 'string') {
		throw new functions.https.HttpsError('invalid-argument', 'Valid returnUrl is required');
	}

	if (!customerEmail || typeof customerEmail !== 'string' || !customerEmail.includes('@')) {
		throw new functions.https.HttpsError('invalid-argument', 'Valid customerEmail is required');
	}

	try {
		const orderId = generateOrderId();

		let coupon;
		if (discountAmount && discountAmount > 0) {
			coupon = await stripe.coupons.create({
				amount_off: discountAmount,
				currency: 'aud',
				duration: 'once',
				name: couponCode ? `Bundle + Coupon (${couponCode})` : 'Bundle Discount',
				metadata: {
					appliedBy: userId,
					couponCode: couponCode || '',
					createdAt: new Date().toISOString(),
					orderId,
				},
			});
		}

		const createPaymentDescription = () => {
			return `Order ${orderId} - ${customerId} - ${lineItems.length} meal${lineItems.length > 1 ? 's' : ''}`;
		};

		// Create the checkout session
		const session = await stripe.checkout.sessions.create({
			line_items: lineItems,
			mode: 'payment',
			ui_mode: 'embedded',
			payment_method_types: ['card'],
			return_url: returnUrl,
			customer_email: customerEmail,
			discounts: coupon ? [{ coupon: coupon.id }] : [],
			metadata: {
				user_id: userId,
				order_id: orderId,
				created_at: new Date().toISOString(),
				total_items: lineItems.length.toString(),
				coupon_code: couponCode || '',
                discount_amount: discountAmount ? discountAmount.toString() : '0',
                sub_total: cartData?.total,
			},
			payment_intent_data: {
				description: createPaymentDescription(),
				metadata: {
					user_id: userId,
					order_id: orderId,
				},
			},
		});

		await createTempOrder(
			orderId,
			userId,
			session.id,
			cartData,
			coupon
		);

		return {
			clientSecret: session.client_secret,
			sessionId: session.id,
			orderId: orderId,
		};
	} catch (error: any) {
		console.error('Error creating checkout session:', error);

		if (error.type === 'StripeInvalidRequestError') {
			throw new functions.https.HttpsError('invalid-argument', `Stripe error: ${error.message}`);
		}

		throw new functions.https.HttpsError('internal', 'Unable to create checkout session');
	}
});

export async function createTempOrder(
	orderId: string,
	userId: string,
	sessionId: string,
	cartData?: any,
	couponData?: any
) {
	const db = admin.firestore();
    
    console.log(cartData);

	const tempOrderData: OptimizedOrderData = {
		orderId,
		userId,
		stripeSessionId: sessionId,

        meals: cartData.meals.map((meal: any) => ({
            id: meal.id,
            main: {
                id: meal.main.id,
                display: meal.main.display,
                price: meal.main.price,
            },
            addOns: meal.addOns.map((addon: any) => ({
                id: addon.id,
                display: addon.display,
                price: addon.price,
            })),
            ...meal.fruit && {
                fruit: {
                    id: meal.fruit.id,
                    display: meal.fruit.display,
                }
            },
            ...meal.probiotic && {
                probiotic: {
                    id: meal.probiotic.id,
                    display: meal.probiotic.display,
                }
            },
            child: {
                id: meal.child.id,
                name: meal.child.name,
            },
            school: {
                id: meal.school.id,
                name: meal.school.name,
                address: meal.school.address,
            },
            orderDate: meal.orderDate,
            total: meal.total,
        })),

		pricing: {
			subtotal: cartData.total,
			finalTotal: cartData.total - (couponData ? couponData.amount_off/100 : 0),
			...(couponData && {
				appliedCoupon: {
					code: couponData.name,
					discountAmount: couponData.amount_off/100,
				}
			}),
		},
		
		status: 'pending',
		createdAt: new Date().toISOString(),
		expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
	};

	// Store in tempOrders collection
	await db.collection('tempOrders').doc(orderId).set(tempOrderData);

	return tempOrderData;
}

function generateOrderId(): string {
	const now = new Date();
	const timestamp = now.toISOString().slice(0, 10).replace(/-/g, '');

	const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
	let randomSuffix = '';
	for (let i = 0; i < 6; i++) {
		randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
	}

	return `ORD-${timestamp}-${randomSuffix}`;
}
