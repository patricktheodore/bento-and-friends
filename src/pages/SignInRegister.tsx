import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const UserloginPage: React.FC = () => {
    const [isNewUserSignup, setIsNewUserSignup] = useState(false);
    const { state } = useAppContext();

    const handleToggleSignup = () => {
        setIsNewUserSignup(!isNewUserSignup);
    }



	return (
        <>
            {/* if state.user -> profile card with logout option, else continue */}
            <div className='w-full flex flex-col justify-center items-center p-4'>
                {state.user ? (
                    <div className='w-full flex flex-col justify-center items-center p-4'>
                        <h1 className='text-2xl font-semibold mb-4'>Profile</h1>
                        <div className='w-full flex flex-col justify-center items-center p-4'>
                            <p className='mb-2'>{state.user.displayName}</p>
                            <p className='mb-2'>{state.user.email}</p>
                            <button className='bg-primary text-white p-2 rounded-md w-full'>Logout</button>
                        </div>
                    </div>
                ) : (
                    isNewUserSignup ? (
                        <div className='w-full flex flex-col justify-center items-center p-4'>
                            <h1 className='text-2xl font-semibold mb-4'>Sign Up</h1>
                            <form className='w-full flex flex-col justify-center items-center p-4'>
                                <input type='text' placeholder='First Name' className='w-full p-2 mb-2' />
                                <input type='text' placeholder='Last Name' className='w-full p-2 mb-2' />
                                <input type='email' placeholder='Email' className='w-full p-2 mb-2' />
                                <input type='password' placeholder='Password' className='w-full p-2 mb-2' />
                                <input type='password' placeholder='Confirm Password' className='w-full p-2 mb-2' />
                                <button className='bg-primary text-white p-2 rounded-md w-full'>Sign Up</button>
                            </form>
                            <p className='text-sm'>Already have an account? <button onClick={handleToggleSignup} className='text-primary'>Login</button></p>
                        </div>
                    ) : (
                        <div className='w-full flex flex-col justify-center items-center p-4'>
                            <h1 className='text-2xl font-semibold mb-4'>Login</h1>
                            <form className='w-full flex flex-col justify-center items-center p-4'>
                                <input type='email' placeholder='Email' className='w-full p-2 mb-2' />
                                <input type='password' placeholder='Password' className='w-full p-2 mb-2' />
                                <button className='bg-primary text-white p-2 rounded-md w-full'>Login</button>
                            </form>
                            <p className='text-sm'>Don't have an account? <button onClick={handleToggleSignup} className='text-primary'>Sign Up</button></p>
                        </div>
                    )
                )}
            </div>
        </>
    );
}

export default UserloginPage;
