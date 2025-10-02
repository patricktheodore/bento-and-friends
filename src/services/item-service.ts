import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Main, Side, AddOn, Fruit, Drink, Platter } from '../models/item.model';

export const getMains = async (): Promise<{ success: boolean; data?: Main[]; error?: string }> => {
	try {
		const mainsCollection = collection(db, 'mains-test');
		const mainsSnapshot = await getDocs(mainsCollection);
		const mains = mainsSnapshot.docs.map((doc) => {
			const data = doc.data();

			return new Main(
				data.display,
				data.image,
				data.description,
				data.allergens,
				data.isNew,
				data.isActive,
				data.isFeatured,
				data.isVegetarian,
				data.addOns || [],
				data.price,
				doc.id,
				data.isPromo,
                data.isTeachersOnly ?? false,
                data.disableSidesSelection ?? false,
                data.validDates || []
			);
		});
		return { success: true, data: mains };
	} catch (error) {
		console.error('Error getting mains: ', error);
		return { success: false, error: (error as Error).message };
	}
};

export const getSides = async (): Promise<{ success: boolean; data?: Side[]; error?: string }> => {
	try {
		const sidesCollection = collection(db, 'sides-test');
		const sidesSnapshot = await getDocs(sidesCollection);
		const sides = sidesSnapshot.docs.map((doc) => {
			const data = doc.data();
			return new Side(data.display, doc.id, data.code, data.isActive);
		});
		return { success: true, data: sides };
	} catch (error) {
		console.error('Error getting sides: ', error);
		return { success: false, error: (error as Error).message };
	}
};

export const getAddOns = async (): Promise<{ success: boolean; data?: AddOn[]; error?: string }> => {
	try {
		const addOnsCollection = collection(db, 'addon-test');
		const addOnsSnapshot = await getDocs(addOnsCollection);
		const addOns = addOnsSnapshot.docs.map((doc) => {
			const data = doc.data();
			return new AddOn(data.display, data.price, doc.id, data.isActive);
		});
		return { success: true, data: addOns };
	} catch (error) {
		console.error('Error getting add-ons: ', error);
		return { success: false, error: (error as Error).message };
	}
};

export const getFruits = async (): Promise<{ success: boolean; data?: Fruit[]; error?: string }> => {
	try {
		const fruitsCollection = collection(db, 'fruits-test');
		const fruitsSnapshot = await getDocs(fruitsCollection);
		const fruits = fruitsSnapshot.docs.map((doc) => {
			const data = doc.data();
			return new Fruit(data.display, doc.id, data.code, data.isActive);
		});
		return { success: true, data: fruits };
	} catch (error) {
		console.error('Error getting fruits: ', error);
		return { success: false, error: (error as Error).message };
	}
};

export const getDrinks = async (): Promise<{ success: boolean; data?: Drink[]; error?: string }> => {
	try {
		const drinksCollection = collection(db, 'drinks-test');
		const drinksSnapshot = await getDocs(drinksCollection);
		const drinks = drinksSnapshot.docs.map((doc) => {
			const data = doc.data();
			return new Drink(data.display, data.image, data.price, doc.id, data.isActive);
		});
		return { success: true, data: drinks };
	} catch (error) {
		console.error('Error getting drinks: ', error);
		return { success: false, error: (error as Error).message };
	}
};

export const getPlatters = async (): Promise<{ success: boolean; data?: Platter[]; error?: string }> => {
	try {
		const plattersCollection = collection(db, 'platters-test');
		const plattersSnapshot = await getDocs(plattersCollection);
		const platters = plattersSnapshot.docs.map((doc) => {
			const data = doc.data();
			return new Platter(data.display, data.image, data.description, data.price, doc.id, data.isActive);
		});
		return { success: true, data: platters };
	} catch (error) {
		console.error('Error getting platters: ', error);
		return { success: false, error: (error as Error).message };
	}
};
