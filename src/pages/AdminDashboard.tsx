import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Schools from '../components/Schools';
import ItemController from '../components/ItemController';
import CouponController from '@/components/CouponController';
import OrdersComponent from '@/components/Orders';
import AdminOverview from '@/components/AdminOverview';
import UsersComponent from '@/components/Users';

const tabs = [
  { name: 'Dashboard', component: AdminOverview },
  { name: 'Orders', component: OrdersComponent },
  { name: 'Users', component: UsersComponent },
  { name: 'Menu Items', component: ItemController },
  { name: 'Schools', component: Schools },
  { name: 'Coupons', component: CouponController },
];

const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const handleTabChange = (value: string) => {
    setActiveTab(Number(value));
  };

  const ActiveComponent = tabs[activeTab].component;

  return (
    <div className="w-full mx-auto p-4 pb-8 md:p-8 lg:p-12 flex flex-col justify-start items-center gap-2">
      <div className="w-full flex flex-col justify-start items-center md:flex-row md:justify-between gap-4 px-4">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        
        {/* Select dropdown for small screens */}
        <div className="md:hidden w-full max-w-xs">
          <Select onValueChange={handleTabChange} defaultValue={activeTab.toString()}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Select a tab" />
            </SelectTrigger>
            <SelectContent>
              {tabs.map((tab, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {tab.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Tab menu for larger screens */}
        <div className="hidden md:flex justify-start items-center gap-2 rounded-md p-1 bg-stone-200">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => handleTabChange(index.toString())}
              className={`text-sm rounded-md py-2 px-4 transition-colors ${
                activeTab === index 
                  ? 'bg-white font-bold' 
                  : 'bg-stone-200 hover:brightness-90'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full bg-card text-card-foreground rounded-lg border shadow-sm p-4">
        {ActiveComponent ? <ActiveComponent /> : <div>Component not implemented yet</div>}
      </div>
    </div>
  );
};

export default AdminDashboardPage;