import React, { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, CheckIcon, PlusIcon } from '@heroicons/react/16/solid';
import { School } from '../models/school.model';
import { Item, Order } from '../models/order.model';

interface Tab {
	name: string;
	active: boolean;
	filters?: TabFilters[];
	tableColumns?: TableColumn[];
}

interface TabFilters {
	[key: string]: boolean;
}

interface TableColumn {
	name: string;
	key: string;
}

const tabs: Tab[] = [
    {
        name: 'Schools',
        active: false,
        filters: [{ All: true }, { Active: true }, { Inactive: false }],
        tableColumns: [
            { name: '', key: 'logo' },
            { name: 'Name', key: 'name' },
            { name: 'Address', key: 'address' },
            { name: 'Contact', key: 'contact' },
            { name: 'Delivery Days', key: 'deliveryDays' },
            { name: 'Status', key: 'status' },
        ],
    },
    {
        name: 'Products',
        active: false,
        filters: [
            { All: true },
            { Active: true },
            { Inactive: false },
            { Main: false },
            { Side: false },
        ],
        tableColumns: [
            { name: '', key: 'image' },
            { name: 'Name', key: 'name' },
            { name: 'Type', key: 'type' },
            { name: 'Allergens', key: 'allergens' },
            { name: 'Price', key: 'price' },
            { name: 'Status', key: 'status' },
        ],
    },
    {
        name: 'Orders',
        active: false,
        filters: [{ All: true }, { Pending: false }, { Completed: false }, { Cancelled: false }],
        tableColumns: [
            { name: 'ID', key: 'id' },
            { name: 'User', key: 'userId' },
            { name: 'Order Date', key: 'orderDate' },
            { name: 'Delivery Date', key: 'deliveryDate' },
            { name: 'Total', key: 'total' },
            { name: 'Status', key: 'status' },
        ],
    },
];

const AdminDashboardPage: React.FC = () => {
	const [activeTab, setActiveTab] = useState<number>(0);
	const [activeFilters, setActiveFilters] = useState<string[]>(
		tabs.map((tab) => (tab.filters ? Object.keys(tab.filters[0])[0] : ''))
	);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [tableColumns, setTableColumns] = useState<TableColumn[]>(tabs[activeTab].tableColumns || []);
	const [filteredData, setFilteredData] = useState();
	const dropdownRef = useRef<HTMLDivElement>(null);

	const handleTabClick = (index: number) => {
		setActiveTab(index);
		setTableColumns(tabs[index].tableColumns || []);
	};

	const handleFilterClick = (filterName: string) => {
        const newActiveFilters = [...activeFilters];
        newActiveFilters[activeTab] = filterName;
        setActiveFilters(newActiveFilters);
        setIsDropdownOpen(false);

		// filter items
    };

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	return (
		<>
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

					<div className="hidden md:flex justify-end items-center gap-2">
						{tabs[activeTab].filters?.map((filter, index) => {
							const filterName = Object.keys(filter)[0];
							return (
								<div
									key={index}
									onClick={() => handleFilterClick(filterName)}
									className={`text-sm rounded-md py-1 px-2 bg-white hover:cursor-pointer hover:brightness-90 border-2 ${
										activeFilters[activeTab] === filterName
											? 'border-brand-dark-green'
											: 'border-transparent'
									}`}
								>
									{filterName}
								</div>
							);
						})}
						<div className='flex justify-center items-center gap-2 text-sm rounded-md py-1 px-2 bg-brand-dark-green text-brand-cream hover:cursor-pointer hover:brightness-75 ring-offset-2 hover:ring-2 hover:ring-brand-dark-green'>
							<PlusIcon className='h-5 w-5'/>
							<span className='text-sm'>Add New</span>
						</div>
					</div>

					<div className="relative md:hidden flex justify-end max-w-[150px] w-full gap-2" ref={dropdownRef}>
						<div
							onClick={() => setIsDropdownOpen(!isDropdownOpen)}
							className="flex items-center justify-between bg-white border rounded-md px-3 py-2 cursor-pointer w-full"
						>
							<span>{activeFilters[activeTab]}</span>
							<ChevronDownIcon
								className={`ml-2 h-5 w-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
							/>
						</div>
						<div className='flex justify-center items-center gap-2 text-sm rounded-md py-2 px-3 bg-brand-dark-green text-brand-cream'>
							<PlusIcon className='h-5 w-5'/>
						</div>
						{isDropdownOpen && (
							<div className="absolute top-full right-0 w-full max-w-[150px] mt-1 bg-white border rounded-md shadow-lg z-10">
								{tabs[activeTab].filters?.map((filter, index) => {
									const filterName = Object.keys(filter)[0];
									return (
										<div
											key={index}
											onClick={() => handleFilterClick(filterName)}
											className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
										>
											<CheckIcon
												className={`mr-2 h-5 w-5 ${
													activeFilters[activeTab] === filterName ? 'visible' : 'invisible'
												}`}
											/>
											<span className="whitespace-nowrap">{filterName}</span>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>

				<div className="w-full bg-white rounded-lg border border-stone-200 p-4">
					<div className="flex flex-col justify-start items-start">
						<span className="text-xl md:text-xl text-primary">{tabs[activeTab].name}</span>
						<span className="text-sm text-brand-taupe">
							View and edit {tabs[activeTab].name.toLowerCase()}.
						</span>
					</div>

					<div className="overflow-x-auto flex justify-start items-start my-4">
						<table className="min-w-full divide-y">
							<thead>
								<tr>
									{tableColumns.map((column, index) => (
										<th
											key={index}
											className="p-4 text-xs text-left text-brand-taupe uppercase font-semibold tracking-wide"
										>
											{column.name}
										</th>
									))}
								</tr>
							</thead>
							<tbody className="divide-y">
								
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</>
	);
};

export default AdminDashboardPage;
