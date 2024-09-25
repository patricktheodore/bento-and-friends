import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Coupon, User } from '../models/user.model';
import { getSchools } from '../services/school-operations';
import { getCurrentUser } from '../services/auth';
import { Order, Meal } from '../models/order.model';
import { School } from '../models/school.model';
import { getMains, getProbiotics, getAddOns, getFruits, getDrinks } from '../services/item-service';
import { getCoupons } from '@/services/coupon-service';
import { AddOn, Drink, Fruit, Main, Probiotic } from '../models/item.model';
import { v4 as uuidv4 } from 'uuid';

type AppState = {
	user: User | null;
	cart: Order | null;
	isCartOpen: boolean;
	mains: Main[];
	probiotics: Probiotic[];
	fruits: Fruit[];
	drinks: Drink[];
	addOns: AddOn[];
	schools: School[];
	coupons: Coupon[];
	items: Array<Main | Probiotic | Fruit | Drink | AddOn>;
	isLoading: boolean;
};

// Define action types
type Action =
	| { type: 'SET_USER'; payload: User | null }
	| { type: 'UPDATE_USER'; payload: Partial<User> }
	| { type: 'ADD_MENU_ITEM'; payload: Main | Probiotic | Fruit | Drink | AddOn }
	| { type: 'UPDATE_MENU_ITEM'; payload: Main | Probiotic | Fruit | Drink | AddOn }
	| { type: 'SET_MENU_ITEMS'; payload: Array<Main | Probiotic | Fruit | Drink | AddOn> }
	| { type: 'SET_MAINS'; payload: Main[] }
	| { type: 'SET_PROBIOTICS'; payload: Probiotic[] }
	| { type: 'SET_FRUITS'; payload: Fruit[] }
	| { type: 'SET_DRINKS'; payload: Drink[] }
	| { type: 'SET_ADD_ONS'; payload: AddOn[] }
	| { type: 'SET_CART'; payload: Order | null }
	| { type: 'ADD_TO_CART'; payload: Meal }
	| { type: 'REMOVE_FROM_CART'; payload: string }
	| { type: 'CLEAR_CART' }
	| { type: 'UPDATE_CART'; payload: Meal[] }
	| { type: 'UPDATE_MEAL'; payload: Meal }
	| { type: 'TOGGLE_CART' }
	| { type: 'SIGN_OUT' }
	| { type: 'SET_LOADING'; payload: boolean }
	| { type: 'SET_SCHOOLS'; payload: School[] }
	| { type: 'ADD_SCHOOL'; payload: School }
	| { type: 'UPDATE_SCHOOL'; payload: School }
	| { type: 'SET_COUPONS'; payload: Coupon[] }
	| { type: 'ADD_COUPON'; payload: Coupon }
	| { type: 'UPDATE_COUPON'; payload: Coupon }
	| { type: 'DELETE_COUPON'; payload: string };

// Initial state
const initialState: AppState = {
	user: null,
	cart: null,
	isCartOpen: false,
	schools: [],
	mains: [],
	probiotics: [],
	fruits: [],
	drinks: [],
	addOns: [],
	items: [],
	coupons: [],
	isLoading: true,
};

const loadCartFromLocalStorage = (): Order | null => {
	const savedCart = localStorage.getItem('cart');
	return savedCart ? JSON.parse(savedCart) : null;
};

const saveCartToLocalStorage = (cart: Order | null) => {
	if (cart) {
		localStorage.setItem('cart', JSON.stringify(cart));
	} else {
		localStorage.removeItem('cart');
	}
};

// Create the context
const AppContext = createContext<
	| {
			state: AppState;
			dispatch: React.Dispatch<Action>;
	  }
	| undefined
>(undefined);

// Reducer function
const appReducer = (state: AppState, action: Action): AppState => {
	let newState: AppState;
	switch (action.type) {
		case 'SET_USER':
			return { ...state, user: action.payload };
		case 'SIGN_OUT':
			return { ...state, user: null, cart: null };
		case 'UPDATE_USER':
			if (!state.user) return state;
			return { ...state, user: { ...state.user, ...action.payload } };
		case 'SET_SCHOOLS':
			return { ...state, schools: action.payload };
		case 'ADD_SCHOOL':
			return { ...state, schools: [...state.schools, action.payload] };
		case 'UPDATE_SCHOOL':
			return {
				...state,
				schools: state.schools.map((school) => (school.id === action.payload.id ? action.payload : school)),
			};
		case 'SET_MENU_ITEMS':
			return { ...state, items: action.payload };
		case 'ADD_MENU_ITEM':
			return { ...state, items: [...state.items, action.payload] };
		case 'UPDATE_MENU_ITEM':
			return {
				...state,
				items: state.items.map((item) => (item.id === action.payload.id ? action.payload : item)),
			};
		case 'SET_MAINS':
			return { ...state, mains: action.payload };
		case 'SET_PROBIOTICS':
			return { ...state, probiotics: action.payload };
		case 'SET_FRUITS':
			return { ...state, fruits: action.payload };
		case 'SET_DRINKS':
			return { ...state, drinks: action.payload };
		case 'SET_ADD_ONS':
			return { ...state, addOns: action.payload };
		case 'SET_LOADING':
			return { ...state, isLoading: action.payload };
		case 'SET_CART':
			newState = { ...state, cart: action.payload };
			saveCartToLocalStorage(action.payload);
			return newState;
		case 'ADD_TO_CART':
			if (!state.cart) {
				newState = {
					...state,
					cart: {
						id: uuidv4(),
						userId: state.user?.id || '',
						userEmail: state.user?.email || '',
						meals: [action.payload],
						total: action.payload.total,
						status: 'pending',
					},
				};
			} else {
				newState = {
					...state,
					cart: {
						...state.cart,
						meals: [...state.cart.meals, action.payload],
						total: state.cart.total + action.payload.total,
					},
				};
			}
			saveCartToLocalStorage(newState.cart);
			return newState;
		case 'REMOVE_FROM_CART':
			if (!state.cart) return state;
			const updatedMeals = state.cart.meals.filter((meal) => meal.id !== action.payload);
			newState = {
				...state,
				cart: {
					...state.cart,
					meals: updatedMeals,
					total: updatedMeals.reduce((sum, meal) => sum + meal.total, 0),
				},
			};
			saveCartToLocalStorage(newState.cart);
			return newState;
		case 'UPDATE_MEAL':
			if (!state.cart) return state;
			const updatedMeal = state.cart.meals.map(meal =>
				meal.id === action.payload.id ? action.payload : meal
			);
			const newCart = {
				...state.cart,
				meals: updatedMeal,
				total: updatedMeal.reduce((sum, meal) => sum + meal.total, 0),
			};
			saveCartToLocalStorage(newCart);
			return {
				...state,
				cart: newCart,
			};
		case 'CLEAR_CART':
			newState = { ...state, cart: null };
			saveCartToLocalStorage(null);
			return newState;
		case 'TOGGLE_CART':
			return { ...state, isCartOpen: !state.isCartOpen };

		case 'SET_COUPONS':
			return { ...state, coupons: action.payload };
		case 'ADD_COUPON':
			return { ...state, coupons: [...state.coupons, action.payload] };
		case 'UPDATE_COUPON':
			return {
				...state,
				coupons: state.coupons.map(coupon =>
				coupon.id === action.payload.id ? action.payload : coupon
				),
			};
		case 'DELETE_COUPON':
			return {
				...state,
				coupons: state.coupons.filter(coupon => coupon.id !== action.payload),
			};

		// case 'ADD_TO_ORDER':
		// 	if (!state.currentOrder) {
		// 		return {
		// 			...state,
		// 			currentOrder: {
		// 				userId: state.user?.id || '',
		// 				items: [action.payload],
		// 				total: action.payload.price,
		// 				status: 'pending',
		// 			},
		// 		};
		// 	}
		// 	return {
		// 		...state,
		// 		currentOrder: {
		// 			...state.currentOrder,
		// 			items: [...state.currentOrder.items, action.payload],
		// 			total: state.currentOrder.total + action.payload.price,
		// 		},
		// 	};
		// case 'REMOVE_FROM_ORDER':
		// 	if (!state.currentOrder) return state;
		// 	const itemToRemove = state.currentOrder.items.find((item) => item.id === action.payload);
		// 	if (!itemToRemove) return state;
		// 	return {
		// 		...state,
		// 		currentOrder: {
		// 			...state.currentOrder,
		// 			items: state.currentOrder.items.filter((item) => item.id !== action.payload),
		// 			total: state.currentOrder.total - itemToRemove.price,
		// 		},
		// 	};
		// case 'CLEAR_ORDER':
		// 	return { ...state, currentOrder: null };
		default:
			return state;
	}
};

// Context provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [state, dispatch] = useReducer(appReducer, initialState);

	useEffect(() => {
		const loadAllData = async () => {
			dispatch({ type: 'SET_LOADING', payload: true });
			try {
				const [user, schools, mains, probiotics, addOns, fruits, drinks, coupons] = await Promise.all([
					getCurrentUser(),
					getSchools(),
					getMains(),
					getProbiotics(),
					getAddOns(),
					getFruits(),
					getDrinks(),
					getCoupons(),
				]);

				dispatch({ type: 'SET_USER', payload: user });
				dispatch({ type: 'SET_SCHOOLS', payload: schools.data ? schools.data : [] });
				dispatch({ type: 'SET_MAINS', payload: mains.data ? mains.data : [] });
				dispatch({ type: 'SET_PROBIOTICS', payload: probiotics.data ? probiotics.data : [] });
				dispatch({ type: 'SET_ADD_ONS', payload: addOns.data ? addOns.data : [] });
				dispatch({ type: 'SET_FRUITS', payload: fruits.data ? fruits.data : [] });
				dispatch({ type: 'SET_DRINKS', payload: drinks.data ? drinks.data : [] });
				dispatch({ type: 'SET_COUPONS', payload: coupons.data ? coupons.data : [] });

				// Load cart from localStorage
				const savedCart = loadCartFromLocalStorage();
				if (savedCart) {
					dispatch({ type: 'SET_CART', payload: savedCart });
				}
			} catch (error) {
				console.error('Error loading data:', error);
			} finally {
				dispatch({ type: 'SET_LOADING', payload: false });
			}
		};

		loadAllData();
	}, []);

	return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};

// Custom hook to use the AppContext
export const useAppContext = () => {
	const context = useContext(AppContext);
	if (context === undefined) {
		throw new Error('useAppContext must be used within an AppProvider');
	}
	return context;
};
