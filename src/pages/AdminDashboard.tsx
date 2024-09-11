import React, { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/16/solid';
import Schools from '../components/Schools';
import ItemController from '../components/ItemController';
// Import other components as needed

const tabs = [
  { name: 'Schools', component: Schools },
  { name: 'Menu Items', component: ItemController },
  { name: 'Orders', component: null },    // TODO: Create Orders component
];

const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [activeFilters, setActiveFilters] = useState<string[]>(
    tabs.map(() => 'All')
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleTabClick = (index: number) => {
    setActiveTab(index);
  };

  const handleFilterClick = (filterName: string) => {
    const newActiveFilters = [...activeFilters];
    newActiveFilters[activeTab] = filterName;
    setActiveFilters(newActiveFilters);
    setIsDropdownOpen(false);
  };

  const ActiveComponent = tabs[activeTab].component;

  return (
    <div className="w-full mx-auto p-4 pb-8 md:p-8 lg:p-12 flex flex-col justify-start items-center gap-2">
      <div className="w-full flex flex-col justify-start items-center md:flex-row md:justify-between gap-4 px-4">
        <h1 className='text-4xl font-bold'>
          Admin Dashboard
        </h1>
        <div className="flex justify-start items-center gap-2 rounded-md p-1 bg-stone-200">
          {tabs.map((tab, index) => (
            <div
              key={index}
              onClick={() => handleTabClick(index)}
              className={`text-sm rounded-md py-1 px-2 hover:cursor-pointer ${
                activeTab === index ? 'bg-white font-bold' : 'bg-stone-200'
              }`}
            >
              {tab.name}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full bg-white rounded-lg border border-stone-200 p-4">
        {ActiveComponent ? <ActiveComponent /> : <div>Component not implemented yet</div>}
      </div>
    </div>
  );
};

export default AdminDashboardPage;