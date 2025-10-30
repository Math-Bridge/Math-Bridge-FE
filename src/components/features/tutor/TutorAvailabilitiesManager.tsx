import React, { useEffect, useState } from 'react';
import { apiService } from '../../../services/api';

interface TutorAvailabilityItem {
  availabilityId: string;
  tutorId: string;
  daysOfWeek: number;
  availableFrom: string; // TimeOnly serialized as string
  availableUntil: string; // TimeOnly serialized as string
  effectiveFrom: string; // DateOnly serialized as string
  effectiveUntil?: string | null; // DateOnly serialized as string or null
  canTeachOnline: boolean;
  canTeachOffline: boolean;
  status: string;
  createdDate?: string;
  updatedDate?: string | null;
  isBooked?: boolean | null;
}

function formatDays(daysOfWeek: number): string {
  const mapping = [
    { bit: 1, label: 'Sun' },
    { bit: 2, label: 'Mon' },
    { bit: 4, label: 'Tue' },
    { bit: 8, label: 'Wed' },
    { bit: 16, label: 'Thu' },
    { bit: 32, label: 'Fri' },
    { bit: 64, label: 'Sat' }
  ];
  return mapping
    .filter(d => (daysOfWeek & d.bit) !== 0)
    .map(d => d.label)
    .join(', ');
}

const TutorAvailabilitiesManager: React.FC = () => {
  const [items, setItems] = useState<TutorAvailabilityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      // Guard token và role trước khi gọi API
      const token = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('user');
      if (!token) {
        if (isMounted) {
          setError('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
          setLoading(false);
        }
        return;
      }
      try {
        const user = userStr ? JSON.parse(userStr) : null;
        const role = user?.role;
        if (role !== 'tutor') {
          if (isMounted) {
            setError('Bạn không có quyền truy cập nội dung này (yêu cầu vai trò tutor).');
            setLoading(false);
          }
          return;
        }
      } catch {
        // ignore malformed user
      }
      const res = await apiService.request<TutorAvailabilityItem[]>(
        '/tutor-availabilities/my-availabilities?activeOnly=true'
      );
      if (!isMounted) return;
      if (res.success && res.data) {
        setItems(res.data);
      } else {
        setError(res.error || 'Không thể tải lịch dạy');
      }
      setLoading(false);
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200">Đang tải lịch dạy...</div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-xl border border-red-200 text-red-600">{error}</div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Lịch dạy của tôi</h3>
      </div>

      {items.length === 0 ? (
        <div className="text-gray-500">Chưa có lịch dạy nào.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Ngày</th>
                <th className="py-2 pr-4">Thời gian</th>
                <th className="py-2 pr-4">Hiệu lực</th>
                <th className="py-2 pr-4">Hình thức</th>
                <th className="py-2 pr-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.availabilityId} className="border-b last:border-b-0">
                  <td className="py-2 pr-4 whitespace-nowrap">{formatDays(item.daysOfWeek)}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {item.availableFrom} - {item.availableUntil}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {item.effectiveFrom}
                    {item.effectiveUntil ? ` → ${item.effectiveUntil}` : ''}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {item.canTeachOnline && 'Online'}{item.canTeachOnline && item.canTeachOffline ? ' / ' : ''}{item.canTeachOffline && 'Offline'}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap capitalize">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TutorAvailabilitiesManager;


