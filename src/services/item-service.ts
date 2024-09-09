import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Main, Probiotic, AddOn, Fruit } from '../models/item.model';

export const getMains = async (): Promise<{ success: boolean; data?: Main[]; error?: string }> => {
	try {
		const mainssCollection = collection(db, 'mains');
		const mainssSnapshot = await getDocs(mainssCollection);
		const mains = mainssSnapshot.docs.map(
			(doc) =>
				({
					id: doc.id,
					...doc.data(),
				} as Main)
		);
		return { success: true, data: mains };
	} catch (error) {
		console.error('Error getting mains: ', error);
		return { success: false, error: (error as Error).message };
	}
};