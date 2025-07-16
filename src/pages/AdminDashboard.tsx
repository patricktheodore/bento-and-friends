import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  ShoppingCart, 
  Users, 
  UtensilsCrossed, 
  GraduationCap, 
  Ticket,
  Settings,
  CalendarHeart
} from 'lucide-react';
import Schools from '../components/Schools';
import ItemController from '../components/ItemController';
import CouponController from '@/components/CouponController';
import OrdersComponent from '@/components/Orders';
import AdminOverview from '@/components/AdminOverview';
import UsersComponent from '@/components/Users';
import Events from '@/components/Events';

const tabs = [
  { name: 'Dashboard', component: AdminOverview, icon: BarChart3 },
  { name: 'Orders', component: OrdersComponent, icon: ShoppingCart },
  { name: 'Users', component: UsersComponent, icon: Users },
  { name: 'Menu Items', component: ItemController, icon: UtensilsCrossed },
  { name: 'Schools', component: Schools, icon: GraduationCap },
  { name: 'Events', component: Events, icon: CalendarHeart },
  { name: 'Coupons', component: CouponController, icon: Ticket },
];

const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const handleTabChange = (value: string) => {
    setActiveTab(Number(value));
  };

  const ActiveComponent = tabs[activeTab].component;

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your business operations</p>
        </div>
        
        {/* Admin Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Settings className="h-3 w-3 mr-1" />
            Admin Access
          </Badge>
        </div>
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          {/* Mobile Select Dropdown */}
          <div className="md:hidden">
            <Select onValueChange={handleTabChange} value={activeTab.toString()}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                {tabs.map((tab, index) => {
                  const Icon = tab.icon;
                  return (
                    <SelectItem key={index} value={index.toString()}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {tab.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          {/* Desktop Tab Menu */}
          <div className="hidden md:flex justify-start items-center gap-2 p-1 bg-gray-100 rounded-lg">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleTabChange(index.toString())}
                  className={`flex items-center gap-2 text-sm rounded-lg py-2 px-4 transition-all duration-200 ${
                    activeTab === index 
                      ? 'bg-white font-medium text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Content Section */}
      <div>

        {/* Active Component */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            {ActiveComponent ? (
              <ActiveComponent />
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
                <p className="text-gray-500">This section is currently under development.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;