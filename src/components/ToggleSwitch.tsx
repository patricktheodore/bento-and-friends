import React from 'react';

interface ToggleSwitchProps {
    id: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange, label }) => {
    return (
        <div className="flex items-center">
            <div className="relative inline-block w-11 mr-2 align-middle select-none">
                <input
                    type="checkbox"
                    name={id}
                    id={id}
                    checked={checked}
                    onChange={onChange}
                    className="sr-only"
                />
                <div
                    className={`block bg-gray-300 w-11 h-6 rounded-full ${
                        checked ? 'bg-green-400' : ''
                    } transition-colors duration-200 ease-in-out`}
                ></div>
                <div
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${
                        checked ? 'transform translate-x-5' : ''
                    }`}
                ></div>
            </div>
            <label
                htmlFor={id}
                className="text-sm text-gray-700 cursor-pointer"
            >
                {label}
            </label>
        </div>
    );
};

export default ToggleSwitch;