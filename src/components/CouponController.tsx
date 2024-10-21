import React, { useState, useEffect } from 'react';
import { PlusIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { getCurrentUser } from '../services/auth';
import { getCoupons, addOrUpdateCoupon, deleteCoupon } from '../services/coupon-service';
import toast from 'react-hot-toast';
import { Coupon } from '../models/user.model';
import { useAppContext } from '../context/AppContext';

import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import CouponModal from './CouponModal';
import { Select, SelectContent, SelectItem, SelectTrigger } from './ui/select';

const CouponController: React.FC = () => {
	const { dispatch } = useAppContext();
	const [coupons, setCoupons] = useState<Coupon[]>([]);
	const [currentCoupon, setCurrentCoupon] = useState<Coupon | null>(null);
	const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		const fetchCouponsAndCheckAdmin = async () => {
			try {
				const user = await getCurrentUser();
				if (!user) {
					toast.error('User not authenticated');
					return;
				}

				setIsAdmin(user.isAdmin);

				const fetchedCoupons = await getCoupons();
				if (fetchedCoupons.success && fetchedCoupons.data) {
					setCoupons(fetchedCoupons.data);
					dispatch({ type: 'SET_COUPONS', payload: fetchedCoupons.data });
				}
			} catch (error) {
				toast.error((error as Error).message);
			}
		};

		fetchCouponsAndCheckAdmin();
	}, [dispatch]);

	const handleSubmitCoupon = async (coupon: Coupon) => {
		try {
			const response = await addOrUpdateCoupon(coupon);

			if (response.success) {
				dispatch({
					type: modalMode === 'add' ? 'ADD_COUPON' : 'UPDATE_COUPON',
					payload: coupon,
				});
				toast.success(`Coupon ${modalMode === 'add' ? 'added' : 'updated'} successfully`);
				setIsCouponModalOpen(false);

				// Refresh the coupons list
				const fetchedCoupons = await getCoupons();
				if (fetchedCoupons.success && fetchedCoupons.data) {
					setCoupons(fetchedCoupons.data);
				}
			} else {
				toast.error(response.error || `Failed to ${modalMode} coupon`);
			}
		} catch (error) {
			toast.error((error as Error).message);
		}
	};

	const handleDeleteCoupon = async (couponId: string) => {
		try {
			const response = await deleteCoupon(couponId);
			if (response.success) {
				dispatch({ type: 'DELETE_COUPON', payload: couponId });
				toast.success('Coupon deleted successfully');

				// Refresh the coupons list
				const fetchedCoupons = await getCoupons();
				if (fetchedCoupons.success && fetchedCoupons.data) {
					setCoupons(fetchedCoupons.data);
				}
			} else {
				toast.error(response.error || 'Failed to delete coupon');
			}
		} catch (error) {
			toast.error((error as Error).message);
		}
	};

	const handleCloseModal = () => {
		setIsCouponModalOpen(false);
		setCurrentCoupon(null);
	};

	const handleOpenModal = (mode: 'add' | 'edit', coupon?: Coupon) => {
		setModalMode(mode);
		setCurrentCoupon(coupon || null);
		setIsCouponModalOpen(true);
	};

	const handleActionSelect = (action: string, coupon: Coupon) => {
		if (action === 'edit') {
			handleOpenModal('edit', coupon);
		} else if (action === 'delete') {
			handleDeleteCoupon(coupon.id);
		}
	};

	if (!isAdmin) {
		return <div>You do not have permission to access this page.</div>;
	}

	return (
    <div className="w-full px-4 space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold">Coupons</h2>
        <Button
          onClick={() => handleOpenModal('add')}
          className="bg-brand-dark-green text-brand-cream"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Coupon
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/5">Code</TableHead>
              <TableHead className="w-1/6 hidden md:table-cell">Discount</TableHead>
              <TableHead className="w-1/6 hidden md:table-cell">Status</TableHead>
              <TableHead className="w-1/6 hidden md:table-cell">Expiry Date</TableHead>
              <TableHead className="w-1/6 hidden md:table-cell">Usage Type</TableHead>
              <TableHead className="w-1/6 hidden md:table-cell">Use Count</TableHead>
              <TableHead className="w-1/6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell className="font-medium">{coupon.code}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {coupon.discountType === 'percentage'
                    ? `${coupon.discountAmount}%`
                    : `$${coupon.discountAmount}`}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {coupon.isActive ? 'Active' : 'Inactive'}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {new Date(coupon.expiryDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {coupon.isSingleUse ? 'Single Use' : 'Multiple'}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {coupon.useCount ? coupon.useCount : '0'}
                </TableCell>
                <TableCell>
                  <div className="hidden md:flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModal('edit', coupon)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCoupon(coupon.id)}
                    >
                      Delete
                    </Button>
                  </div>
                  <div className="md:hidden">
                    <Select onValueChange={(value) => handleActionSelect(value, coupon)}>
                      <SelectTrigger className="w-full">
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="edit">Edit</SelectItem>
                        <SelectItem value="delete">Delete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CouponModal
        isOpen={isCouponModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitCoupon}
        coupon={currentCoupon}
        mode={modalMode}
      />
    </div>
  );
};

export default CouponController;
