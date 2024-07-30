import React from 'react';
import { useAppContext } from '../context/AppContext';

const AccountPage: React.FC = () => {
    const { state, dispatch } = useAppContext();

    return (
        <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            {state.user ? (
                <div className='w-full flex flex-col justify-center items-center p-4'>
                    <h1 className='text-2xl font-semibold mb-4'>Welcome {state.user.displayName}!</h1>
                    <p className='text-lg'>Email: {state.user.email}</p>
                </div>
            ) : (
                <div className='w-full flex flex-col justify-center items-center p-4'>
                    <h1 className='text-2xl font-semibold mb-4'>You are not signed in.</h1>
                </div>
            )}
        </div>
    );
}

export default AccountPage;