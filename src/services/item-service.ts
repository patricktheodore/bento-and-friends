import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Main, Probiotic, AddOn, Fruit, Drink, Platter } from '../models/item.model';

export const getMains = async (): Promise<{ success: boolean; data?: Main[]; error?: string }> => {
    try {
        const mainsCollection = collection(db, 'mains');
        const mainsSnapshot = await getDocs(mainsCollection);
        const mains = mainsSnapshot.docs.map(doc => {
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
                data.addOns,
                data.price,
				doc.id,
				data.isPromo
            );
        });
        return { success: true, data: mains };
    } catch (error) {
        console.error('Error getting mains: ', error);
        return { success: false, error: (error as Error).message };
    }
};

// Similar updates for getProbiotics, getAddOns, getFruits, and getDrinks
// Example for getProbiotics:
export const getProbiotics = async (): Promise<{ success: boolean; data?: Probiotic[]; error?: string }> => {
    try {
        const probioticsCollection = collection(db, 'probiotics');
        const probioticsSnapshot = await getDocs(probioticsCollection);
        const probiotics = probioticsSnapshot.docs.map(doc => {
            const data = doc.data();
            return new Probiotic(data.display, doc.id);
        });
        return { success: true, data: probiotics };
    } catch (error) {
        console.error('Error getting probiotics: ', error);
        return { success: false, error: (error as Error).message };
    }
};

export const getAddOns = async (): Promise<{ success: boolean; data?: AddOn[]; error?: string }> => {
	try {
		const addOnsCollection = collection(db, 'addon');
		const addOnsSnapshot = await getDocs(addOnsCollection);
		const addOns = addOnsSnapshot.docs.map(doc => {
			const data = doc.data();
			return new AddOn(data.display, data.price, doc.id);
		});
		return { success: true, data: addOns };
	} catch (error) {
		console.error('Error getting add-ons: ', error);
		return { success: false, error: (error as Error).message };
	}
};

export const getFruits = async (): Promise<{ success: boolean; data?: Fruit[]; error?: string }> => {
	try {
		const fruitsCollection = collection(db, 'fruits');
		const fruitsSnapshot = await getDocs(fruitsCollection);
		const fruits = fruitsSnapshot.docs.map(doc => {
			const data = doc.data();
			return new Fruit(data.display, doc.id);
		});
		return { success: true, data: fruits };
	} catch (error) {
		console.error('Error getting fruits: ', error);
		return { success: false, error: (error as Error).message };
	}
};

export const getDrinks = async (): Promise<{ success: boolean; data?: Drink[]; error?: string }> => {
	try {
		const drinksCollection = collection(db, 'drinks');
		const drinksSnapshot = await getDocs(drinksCollection);
		const drinks = drinksSnapshot.docs.map(doc => {
			const data = doc.data();
			return new Drink(
				data.display,
				data.image,
				data.price,
				doc.id
			);
		});
		return { success: true, data: drinks };
	} catch (error) {
		console.error('Error getting drinks: ', error);
		return { success: false, error: (error as Error).message };
	}
};

export const getPlatters = async (): Promise<{ success: boolean; data?: Platter[]; error?: string }> => {
	try {
		const plattersCollection = collection(db, 'platters');
		const plattersSnapshot = await getDocs(plattersCollection);
		const platters = plattersSnapshot.docs.map(doc => {
			const data = doc.data();
			return new Platter(
				data.display,
				data.image,
				data.description,
				data.price,
				doc.id
			);
		});
		return { success: true, data: platters };
	} catch (error) {
		console.error('Error getting platters: ', error);
		return { success: false, error: (error as Error).message };
	}
}