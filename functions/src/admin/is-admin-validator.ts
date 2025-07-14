import { getFirestore } from "firebase-admin/firestore";

export const isUserAdmin = async (uid: string): Promise<boolean> => {
  try {
    const userDoc = await getFirestore().collection("users-test2").doc(uid).get();

    if (!userDoc.exists) {
      return false;
    }

    const userData = userDoc.data();
    return userData?.isAdmin === true;

  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};