import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { signOut } from '../services/auth';

const SignOut: React.FC = () => {
    const { state } = useAppContext();
    const { dispatch } = useAppContext();
    
    const handleSignOut = async () => {
        try {
          await signOut();
          dispatch({ type: 'SIGN_OUT' });
        } catch (error) {
          console.error('Error signing out:', error);
        }
    };

    useEffect(() => {
        handleSignOut();
    }, []);

	return (
        <>
            {state.user ? (
                <div className='w-full flex flex-col justify-center items-center p-4'>
                    <h1 className='text-2xl font-semibold mb-4'>Signing Out...</h1>
                </div>
            ) : (
                <div className='w-full flex flex-col justify-center items-center p-4'>
                    <h1 className='text-2xl font-semibold mb-4'>You have been sign out!</h1>
                </div>
            )}
        </>
    );
}

export default SignOut;
