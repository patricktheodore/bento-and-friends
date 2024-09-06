import React, { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/16/solid';
import Schools from '../components/Schools';
// Import other components as needed

const tabs = [
  { name: 'Schools', component: Schools },
  { name: 'Products', component: null },  // TODO: Create Products component
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
    <div className="w-full mx-auto p-4 pb-8 flex flex-col justify-start items-center gap-2">
      <div className="w-full flex justify-between items-center gap-4">
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

        <div className="relative flex justify-end max-w-[150px] w-full gap-2">
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between bg-white border rounded-md px-3 py-2 cursor-pointer w-full"
          >
            <span>{activeFilters[activeTab]}</span>
            <ChevronDownIcon
              className={`ml-2 h-5 w-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </div>
          {isDropdownOpen && (
            <div className="absolute top-full right-0 w-full max-w-[150px] mt-1 bg-white border rounded-md shadow-lg z-10">
              {['All', 'Active', 'Inactive'].map((filter) => (
                <div
                  key={filter}
                  onClick={() => handleFilterClick(filter)}
                  className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <span className="whitespace-nowrap">{filter}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full bg-white rounded-lg border border-stone-200 p-4">
        {ActiveComponent ? <ActiveComponent /> : <div>Component not implemented yet</div>}
      </div>
    </div>
  );
};

export default AdminDashboardPage;