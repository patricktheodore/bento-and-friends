import React, { useState } from 'react';
import { User } from '../models/user.model';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateUserInFirebase } from '../services/user-service';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

interface AccountDetailsProps {
    user: User;
}

const AccountDetails: React.FC<AccountDetailsProps> = ({ user }) => {
    const { state, dispatch } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [phone, setPhone] = useState(user.phone || '');
    const [displayName, setDisplayName] = useState(user.displayName);
    const [phoneError, setPhoneError] = useState<string>('');

    // Get unique schools from children
    const getChildrenSchools = (): string[] => {
        if (!user.children || user.children.length === 0) return [];
        
        const schoolIds = [...new Set(user.children.map(child => child.schoolId).filter(Boolean))];
        const schoolNames = schoolIds.map(schoolId => {
            const school = state.schools.find(s => s.id === schoolId);
            return school ? school.name : 'Unknown School';
        });
        
        return schoolNames;
    };

    const validatePhoneNumber = (phoneNumber: string): boolean => {
        // Remove any non-digit characters
        const cleanPhone = phoneNumber.replace(/\D/g, '');

        // If empty, it's valid (since phone is optional)
        if (cleanPhone === '') {
            setPhoneError('');
            return true;
        }

        // Check for Australian mobile format (04XX XXX XXX)
        if (cleanPhone.length === 10 && cleanPhone.startsWith('04')) {
            setPhoneError('');
            return true;
        }

        // Check for Australian landline format (0X XXXX XXXX)
        if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) {
            setPhoneError('');
            return true;
        }

        // If none of the above conditions are met, set appropriate error
        if (cleanPhone.length !== 10) {
            setPhoneError('Phone number must be 10 digits');
            return false;
        }

        if (!cleanPhone.startsWith('0')) {
            setPhoneError('Phone number must start with 0');
            return false;
        }

        setPhoneError('Invalid phone number format');
        return false;
    };

    const formatPhoneNumber = (value: string): string => {
        // Remove any non-digit characters
        const cleanNum = value.replace(/\D/g, '');
        
        // Don't format if less than 4 digits
        if (cleanNum.length < 4) return cleanNum;
        
        // Format as: 04XX XXX XXX or 0X XXXX XXXX
        if (cleanNum.startsWith('04')) {
            return cleanNum.slice(0, 4) + ' ' + 
                   (cleanNum.slice(4, 7) ? cleanNum.slice(4, 7) + ' ' : '') +
                   cleanNum.slice(7, 10);
        } else {
            return cleanNum.slice(0, 2) + ' ' + 
                   (cleanNum.slice(2, 6) ? cleanNum.slice(2, 6) + ' ' : '') +
                   cleanNum.slice(6, 10);
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow empty value (optional field)
        if (value === '') {
            setPhone('');
            setPhoneError('');
            return;
        }

        // Only allow digits and spaces
        const cleanValue = value.replace(/[^\d\s]/g, '');
        const formattedValue = formatPhoneNumber(cleanValue);
        setPhone(formattedValue);
        validatePhoneNumber(formattedValue);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate phone before submission
        if (phone && !validatePhoneNumber(phone)) {
            toast.error('Please enter a valid phone number');
            return;
        }

        const updatedUser = {
            ...user,
            phone: phone.replace(/\s/g, ''), // Remove spaces before saving
            displayName
        };

        try {
            await updateUserInFirebase(updatedUser);
            dispatch({ type: 'UPDATE_USER', payload: updatedUser });
            
            setIsEditing(false);
            toast.success('Account details updated successfully');
        } catch (error) {
            toast.error('Failed to update account details');
            console.error('Error updating account details:', error);
        }
    };

    const handleCancel = () => {
        // Reset values to original user data
        setPhone(user.phone || '');
        setDisplayName(user.displayName);
        setPhoneError('');
        setIsEditing(false);
    };

    const childrenSchools = getChildrenSchools();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Account Details</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Name</Label>
                        {isEditing ? (
                            <Input
                                id="displayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                            />
                        ) : (
                            <p className="text-gray-700">{displayName}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <p className="text-gray-700">{user.email}</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="schools">Schools</Label>
                        <div className="text-gray-700">
                            {childrenSchools.length > 0 ? (
                                <div className="space-y-1">
                                    {childrenSchools.map((schoolName, index) => (
                                        <p key={index}>{schoolName}</p>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">
                                    No schools (add children to see their schools)
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                        {isEditing ? (
                            <div className="space-y-1">
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    placeholder="Enter phone number (e.g., 04XX XXX XXX)"
                                    className={phoneError ? 'border-red-500' : ''}
                                />
                                {phoneError && (
                                    <p className="text-sm text-red-500">{phoneError}</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-700">
                                {phone ? formatPhoneNumber(phone) : 'Not provided'}
                            </p>
                        )}
                    </div>

                    <div className="col-span-full flex justify-end space-x-2">
                        {isEditing ? (
                            <>
                                <Button type="button" variant="outline" onClick={handleCancel}>
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={!!phoneError}
                                >
                                    Save Changes
                                </Button>
                            </>
                        ) : (
                            <Button type="button" onClick={() => setIsEditing(true)}>
                                Edit Details
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default AccountDetails;