import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const isUserAdmin = async (uid: string) => {
    try {
      const userDoc = await admin.firestore().collection('users').doc(uid).get();
      const userData = userDoc.data();
      return userData && userData.isAdmin === true;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

interface SchoolData {
  name: string;
  address: string;
  deliveryDays: string;
  classes: {
    id: string;
    name: string;
    teacher: string;
  }[];
}

export const addSchool = functions.https.onCall(async (data: SchoolData, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to add a school.');
  }

  if (!(await isUserAdmin(context.auth.uid))) {
    throw new functions.https.HttpsError('permission-denied', 'User must be an admin to add a school.');
  }

  const {
    name,
    address,
    deliveryDays,
    classes
  } = data;

  // Validate input
  if (!name || !address || !deliveryDays) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
  }

  try {
    const schoolRef = admin.firestore().collection('schools').doc();
    const newSchool = {
      id: schoolRef.id,
      name,
      address,
      deliveryDays,
      classes: classes || [],
      scheduledDates: [],
      isActive: true,
    };

    await schoolRef.set(newSchool);

    return { success: true, schoolId: schoolRef.id };
  } catch (error) {
    console.error('Error adding school:', error);
    throw new functions.https.HttpsError('internal', 'Error adding school to database.');
  }
});

exports.getSchools = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to fetch schools.');
    }
  
    try {
      const snapshot = await admin.firestore().collection('schools').get();
      const schools = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { schools };
    } catch (error) {
      console.error('Error fetching schools:', error);
      throw new functions.https.HttpsError('internal', 'Error fetching schools from database.');
    }
  });
  
  exports.updateSchool = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to update a school.');
    }

    if (!(await isUserAdmin(context.auth.uid))) {
        throw new functions.https.HttpsError('permission-denied', 'User must be an admin to add a school.');
      }
  
    const { id, ...updateData } = data;
  
    if (!id) {
      throw new functions.https.HttpsError('invalid-argument', 'School ID is required.');
    }
  
    try {
      await admin.firestore().collection('schools').doc(id).update(updateData);
      return { success: true, schoolId: id };
    } catch (error) {
      console.error('Error updating school:', error);
      throw new functions.https.HttpsError('internal', 'Error updating school in database.');
    }
  });
  
  exports.deleteSchool = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to delete a school.');
    }

    if (!(await isUserAdmin(context.auth.uid))) {
        throw new functions.https.HttpsError('permission-denied', 'User must be an admin to add a school.');
      }
  
    const { id } = data;
  
    if (!id) {
      throw new functions.https.HttpsError('invalid-argument', 'School ID is required.');
    }
  
    try {
      await admin.firestore().collection('schools').doc(id).delete();
      return { success: true, schoolId: id };
    } catch (error) {
      console.error('Error deleting school:', error);
      throw new functions.https.HttpsError('internal', 'Error deleting school from database.');
    }
  });