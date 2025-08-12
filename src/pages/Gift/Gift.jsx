'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Edit, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../../service/api';
import { getImageUrl } from '../../common/commonFunc';

const GiftManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gifts, setGifts] = useState([]);
  const [productVariants, setProductVariants] = useState([]);
  const [editGiftId, setEditGiftId] = useState(null);
  const [editForm, setEditForm] = useState({
    productVariantIds: '',
    productVariantId: '',
    stock: '',
    startDay: '',
    endDay: '',
  });

  // Mock data for gifts with attributes
  const mockGifts = [
    {
      id: 1,
      productVariantId: 'variant_001',
      productVariantIds: ['variant_002', 'variant_003'],
      stock: 50,
      startDay: '2025-07-01T10:00',
      endDay: '2025-07-15T23:59',
      image: 'https://via.placeholder.com/64?text=Gift1',
      attributes: { color: 'Xanh', volume: '100ml' },
    },
    {
      id: 2,
      productVariantId: 'variant_002',
      productVariantIds: ['variant_001', 'variant_004'],
      stock: 30,
      startDay: '2025-07-05T09:00',
      endDay: '2025-07-20T23:59',
      image: 'https://via.placeholder.com/64?text=Gift2',
      attributes: { color: 'Đen', size: 'L' },
    },
    {
      id: 3,
      productVariantId: 'variant_003',
      productVariantIds: ['variant_001', 'variant_002'],
      stock: 20,
      startDay: '2025-07-10T08:00',
      endDay: '2025-07-25T23:59',
      image: 'https://via.placeholder.com/64?text=Gift3',
      attributes: { color: 'Xanh', size: '32' },
    },
  ];

  // Mock data for productVariants
  const mockProductVariants = [
    {
      id: 'variant_001',
      name: 'Áo thun trắng size M',
      image: 'https://via.placeholder.com/64?text=Variant1',
    },
    {
      id: 'variant_002',
      name: 'Áo thun đen size L',
      image: 'https://via.placeholder.com/64?text=Variant2',
    },
    {
      id: 'variant_003',
      name: 'Quần jeans xanh size 32',
      image: 'https://via.placeholder.com/64?text=Variant3',
    },
    {
      id: 'variant_004',
      name: 'Mũ lưỡi trai đỏ',
      image: 'https://via.placeholder.com/64?text=Variant4',
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Use mock data instead of API calls
        const response = await api.get('/gift');
        if (response.data.result) {
          setGifts(response.data.result);
          console.log(response.data.result);
        } else {
          setError(response?.data?.message || 'Không thể tải danh sách quf tặng');
        }
        setProductVariants(mockProductVariants);
      } catch (error) {
        setError('Lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Delete Gift
  const handleDeleteGift = async (giftId) => {
    const result = await Swal.fire({
      title: 'Xác nhận',
      text: 'Bạn có chắc muốn xóa quà tặng này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/gifts/${giftId}`);
        setGifts(gifts.filter((gift) => gift.id !== giftId));
        Swal.fire({
          title: 'Thành công',
          text: 'Đã xóa quà tặng thành công!',
          icon: 'success',
          confirmButtonColor: '#22c55e',
        });
      } catch (error) {
        console.error('Error deleting gift:', error);
        setError(error.response?.data?.message || 'Lỗi khi xóa quà tặng');
        Swal.fire({
          title: 'Lỗi',
          text: error.response?.data?.message || 'Lỗi khi xóa quà tặng',
          icon: 'error',
          confirmButtonColor: '#ef4444',
        });
      }
    }
  };

  // Open Edit Form
  const handleEditGift = (gift) => {
    setEditGiftId(gift.id);
    setEditForm({
      productVariantIds: gift.productVariantIds.join(','),
      productVariantId: gift.productVariantId,
      stock: gift.stock.toString(),
      startDay: gift.startDay.slice(0, 16),
      endDay: gift.endDay.slice(0, 16),
    });
  };

  // Cancel Edit
  const handleCancelEdit = () => {
    setEditGiftId(null);
    setEditForm({
      productVariantIds: '',
      productVariantId: '',
      stock: '',
      startDay: '',
      endDay: '',
    });
  };

  // Update Gift
  const handleUpdateGift = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate input
      if (
        !editForm.productVariantIds ||
        !editForm.productVariantId ||
        !editForm.stock ||
        !editForm.startDay ||
        !editForm.endDay
      ) {
        setError('Vui lòng nhập đầy đủ thông tin quà tặng');
        return;
      }
      if (parseInt(editForm.stock) < 0) {
        setError('Số lượng tồn kho phải lớn hơn hoặc bằng 0');
        return;
      }
      if (new Date(editForm.startDay) > new Date(editForm.endDay)) {
        setError('Ngày bắt đầu phải trước ngày kết thúc');
        return;
      }

      const payload = {
        product_variant_ids: editForm.productVariantIds,
        product_variant_id: editForm.productVariantId,
        stock: parseInt(editForm.stock),
        start_day: editForm.startDay,
        end_day: editForm.endDay,
      };

      const response = await api.put(`/gifts/${editGiftId}`, payload);
      setGifts(gifts.map((gift) => (gift.id === editGiftId ? response.data.result : gift)));
      Swal.fire({
        title: 'Thành công',
        text: 'Đã cập nhật quà tặng thành công!',
        icon: 'success',
        confirmButtonColor: '#22c55e',
      });
      handleCancelEdit();
    } catch (error) {
      console.error('Error updating gift:', error);
      setError(error.response?.data?.message || 'Lỗi khi cập nhật quà tặng');
      Swal.fire({
        title: 'Lỗi',
        text: error.response?.data?.message || 'Lỗi khi cập nhật quà tặng',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleString('vi-VN') : '';
  };

  // Format attributes for display
  const formatAttributes = (attributes) => {
    return Object.entries(attributes)
      .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
      .join(', ');
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-6 bg-gray-100 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 sm:p-6 bg-gray-100 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <Link
              to="/orders"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Quay lại danh sách đơn hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:space-x-4">
        <Link
          to="/add-gift"
          className="px-4 py-2 text-sm uppercase bg-blue-500 text-white rounded-sm hover:bg-blue-600 flex items-center transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm quà tặng mới
        </Link>
      </div>

      {/* Gift List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="bg-[#00D5BE] text-white p-3 rounded-t-lg">
          <h2 className="text-base font-semibold">QUẢN LÝ QUÀ TẶNG ({gifts.length} mục)</h2>
        </div>
        <div className="p-4 overflow-x-auto">
          {gifts.length > 0 ? (
            <table className="w-full text-sm text-gray-700">
              <thead className="text-sm text-gray-700 bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-center">
                    STT
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    Quà tặng
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Hình ảnh
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    Thuộc tính
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Tồn kho
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Ngày bắt đầu
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Ngày kết thúc
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {gifts.map((gift, index) => (
                  <tr key={gift.id} className="hover:bg-gray-100">
                    <td className="px-4 py-3 text-center">{index + 1}</td>
                    <td className="px-4 py-3 text-left items-center">{gift?.name}</td>
                    <td className="px-4 py-3 text-center">
                      {gift.image ? (
                        <img
                          src={getImageUrl(gift.image)}
                          alt="Gift"
                          className="w-16 h-16 object-cover rounded mx-auto"
                        />
                      ) : (
                        'Không có hình ảnh'
                      )}
                    </td>
                    <td className="px-4 py-3 text-left">
                      {gift.attribute_values.map((attr, idx) => (
                        <p key={idx}>
                          <strong className="font-semibold">{attr.attribute_id}</strong> : {attr.id}
                        </p>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-center">{gift.stock}</td>
                    <td className="px-4 py-3 text-center">{formatDate(gift.start_day)}</td>
                    <td className="px-4 py-3 text-center">{formatDate(gift.end_day)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          onClick={() => handleEditGift(gift)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGift(gift.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-600">Chưa có quà tặng</div>
          )}
        </div>
      </div>

      {/* Edit Form */}
      {editGiftId && (
        <div className="bg-white rounded-lg shadow-md mt-6">
          <div className="bg-[#00D5BE] text-white p-3 rounded-t-lg">
            <h2 className="text-base font-semibold">CHỈNH SỬA QUÀ TẶNG</h2>
          </div>
          <div className="p-4">
            {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID các biến thể sản phẩm (phân tách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={editForm.productVariantIds}
                  onChange={(e) => setEditForm({ ...editForm, productVariantIds: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập ID các biến thể sản phẩm (ví dụ: id1,id2,id3)..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Biến thể sản phẩm quà tặng
                </label>
                <select
                  value={editForm.productVariantId}
                  onChange={(e) => setEditForm({ ...editForm, productVariantId: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn biến thể sản phẩm quà tặng</option>
                  {productVariants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.name || variant.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng tồn kho
                </label>
                <input
                  type="number"
                  value={editForm.stock}
                  onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập số lượng tồn kho..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu</label>
                <input
                  type="datetime-local"
                  value={editForm.startDay}
                  onChange={(e) => setEditForm({ ...editForm, startDay: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày kết thúc
                </label>
                <input
                  type="datetime-local"
                  value={editForm.endDay}
                  onChange={(e) => setEditForm({ ...editForm, endDay: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateGift}
                disabled={loading}
                className={`px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Đang xử lý...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftManagement;
