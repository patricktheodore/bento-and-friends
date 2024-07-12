import React, { useState, useEffect } from 'react';
import { User } from '../types/user';
import { getUserData } from '../utils/user-management';
import { auth } from '../firebase';

const UserProfile: React.FC = () => {
  const [userData, setUserData] = useState<User | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const user = await getUserData(auth.currentUser.uid);
        setUserData(user);
      }
    };

    fetchUserData();
  }, []);

  if (!userData) return <div>Loading...</div>;

  return (
    <div>
      <h2>{userData.displayName}</h2>
      <p>{userData.email}</p>
      {userData.isAdmin && <p>Admin User</p>}
    </div>
  );
};

export default UserProfile;