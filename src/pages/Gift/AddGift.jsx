'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import Modal from 'react-modal';
import api from '../../service/api';
import { getImageUrl } from '../../common/commonFunc';

// Đặt app element cho accessibility
Modal.setAppElement('#root');

const AddGift = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [productVariants, setProductVariants] = useState([]);
  const [giftForm, setGiftForm] = useState({
    productVariantIds: '',
    productVariantId: '',
    stock: '',
    startDay: '',
    endDay: '',
  });
  const [searchTermGift, setSearchTermGift] = useState('');
  const [searchTermProducts, setSearchTermProducts] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);

  // Lấy danh sách ProductVariant
  const fetchProductVariants = async () => {
    try {
      const response = await api.get('/product-variant');
      if (response.data.result) {
        setProductVariants(response.data.result);
      } else {
        setError(response?.data?.message || 'Không thể tải danh sách biến thể sản phẩm');
      }
    } catch (error) {
      console.error('Error fetching product variants:', error);
      setError(error.response?.data?.message || 'Lỗi kết nối API');
    }
  };

  // Xử lý thêm quà tặng
  const handleAddGift = async () => {
    try {
      setLoading(true);
      setError('');

      if (
        !giftForm.productVariantIds ||
        !giftForm.productVariantId ||
        !giftForm.stock ||
        !giftForm.startDay ||
        !giftForm.endDay
      ) {
        setError('Vui lòng nhập đầy đủ thông tin quà tặng');
        return;
      }
      if (parseInt(giftForm.stock) < 0) {
        setError('Số lượng tồn kho phải lớn hơn hoặc bằng 0');
        return;
      }
      if (new Date(giftForm.startDay) > new Date(giftForm.endDay)) {
        setError('Ngày bắt đầu phải trước ngày kết thúc');
        return;
      }

      const giftVariant = productVariants.find((v) => v.id === giftForm.productVariantId);
      if (giftVariant && parseInt(giftForm.stock) > (giftVariant.stock || 0)) {
        setError('Số lượng quà tặng không được lớn hơn số lượng tồn kho của quà tặng');
        return;
      }

      const payload = {
        product_variant_ids: giftForm.productVariantIds,
        product_variant_id: giftForm.productVariantId,
        stock: parseInt(giftForm.stock),
        start_day: giftForm.startDay,
        end_day: giftForm.endDay,
      };

      const response = await api.post('/gift', payload);
      Swal.fire({
        title: 'Thành công',
        text: 'Đã thêm quà tặng thành công!',
        icon: 'success',
        confirmButtonColor: '#22c55e',
      });

      setGiftForm({
        productVariantIds: '',
        productVariantId: '',
        stock: '',
        startDay: '',
        endDay: '',
      });
    } catch (error) {
      console.error('Error adding gift:', error);
      setError(error.response?.data?.message || 'Lỗi khi thêm quà tặng');
      Swal.fire({
        title: 'Lỗi',
        text: error.response?.data?.message || 'Lỗi khi thêm quà tặng',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setLoading(false);
    }
  };

  // Xử lý chọn sản phẩm có quà tặng
  const handleProductSelection = (id) => {
    const currentIds = giftForm.productVariantIds ? giftForm.productVariantIds.split(',') : [];
    let newIds;
    if (currentIds.includes(id)) {
      newIds = currentIds.filter((item) => item !== id).join(',');
    } else {
      newIds = [...currentIds, id].filter(Boolean).join(',');
    }
    setGiftForm({ ...giftForm, productVariantIds: newIds });
  };

  // Xử lý chọn tất cả sản phẩm
  const handleSelectAllProducts = () => {
    const filteredIds = filteredProductVariants.map((variant) => variant.id);
    const currentIds = giftForm.productVariantIds ? giftForm.productVariantIds.split(',') : [];
    const allSelected = filteredIds.every((id) => currentIds.includes(id));

    let newIds;
    if (allSelected) {
      newIds = currentIds.filter((id) => !filteredIds.includes(id)).join(',');
    } else {
      newIds = [...new Set([...currentIds, ...filteredIds])].filter(Boolean).join(',');
    }
    setGiftForm({ ...giftForm, productVariantIds: newIds });
  };

  // Xử lý chọn quà tặng
  const handleGiftSelection = (id) => {
    setGiftForm({ ...giftForm, productVariantId: id });
    setIsGiftModalOpen(false);
  };

  // Lọc danh sách biến thể
  const filteredProductVariants = productVariants.filter((variant) =>
    variant.name.toLowerCase().includes(searchTermProducts.toLowerCase()),
  );
  const filteredGiftVariants = productVariants.filter((variant) =>
    variant.name.toLowerCase().includes(searchTermGift.toLowerCase()),
  );

  // Hiển thị tên sản phẩm thay vì mã
  const getProductNames = () => {
    if (!giftForm.productVariantIds) return '';
    const ids = giftForm.productVariantIds.split(',');
    return ids
      .map((id) => productVariants.find((v) => v.id === id)?.name || id)
      .filter(Boolean)
      .join(', ');
  };

  useEffect(() => {
    fetchProductVariants();
  }, []);

  // Style cho Modal
  const modalStyles = {
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 50,
    },
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      transform: 'translate(-50%, -50%)',
      width: '100%',
      maxWidth: '960px',
      padding: '24px',
      borderRadius: '8px',
      backgroundColor: '#fff',
    },
  };

  return (
    <div className="p-3 sm:p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <Link
          to="/gifts"
          className="inline-flex items-center px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách quà tặng
        </Link>
      </div>

      {/* Form thêm quà tặng */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="bg-[#00D5BE] text-white p-3 rounded-t-lg">
          <h2 className="text-base font-semibold">THÊM QUÀ TẶNG</h2>
        </div>
        <div className="p-4">
          {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}
          <div className="grid grid-cols-1 gap-4">
            {/* Chọn sản phẩm có quà tặng */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn sản phẩm có quà tặng
              </label>
              <input
                type="text"
                value={getProductNames()}
                onClick={() => setIsProductModalOpen(true)}
                readOnly
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-gray-100"
                placeholder="Nhấn để chọn sản phẩm..."
              />
            </div>

            {/* Chọn quà tặng */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chọn quà tặng</label>
              <input
                type="text"
                value={
                  productVariants.find((v) => v.id === giftForm.productVariantId)?.name ||
                  giftForm.productVariantId
                }
                onClick={() => setIsGiftModalOpen(true)}
                readOnly
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-gray-100"
                placeholder="Nhấn để chọn quà tặng..."
              />
            </div>

            {/* Số lượng tồn kho */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lượng tồn kho
              </label>
              <input
                type="number"
                value={giftForm.stock}
                onChange={(e) => setGiftForm({ ...giftForm, stock: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập số lượng tồn kho..."
              />
            </div>

            {/* Ngày bắt đầu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu</label>
              <input
                type="datetime-local"
                value={giftForm.startDay}
                onChange={(e) => setGiftForm({ ...giftForm, startDay: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Ngày kết thúc */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc</label>
              <input
                type="datetime-local"
                value={giftForm.endDay}
                onChange={(e) => setGiftForm({ ...giftForm, endDay: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAddGift}
              disabled={loading}
              className={`px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Đang xử lý...' : 'Thêm quà tặng'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal chọn sản phẩm có quà tặng */}
      <Modal
        isOpen={isProductModalOpen}
        onRequestClose={() => setIsProductModalOpen(false)}
        style={modalStyles}
      >
        <h2 className="text-lg font-semibold mb-4">Chọn sản phẩm có quà tặng</h2>
        <input
          type="text"
          value={searchTermProducts}
          onChange={(e) => setSearchTermProducts(e.target.value)}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          placeholder="Tìm kiếm sản phẩm..."
        />
        <div className="max-h-80 overflow-y-auto border rounded">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    onChange={handleSelectAllProducts}
                    checked={
                      filteredProductVariants.length > 0 &&
                      filteredProductVariants.every((variant) =>
                        giftForm.productVariantIds.split(',').includes(variant.id),
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3">Hình ảnh</th>
                <th className="px-4 py-3">Tên biến thể</th>
                <th className="px-4 py-3">Số lượng</th>
              </tr>
            </thead>
            <tbody>
              {filteredProductVariants.length > 0 ? (
                filteredProductVariants.map((variant) => (
                  <tr key={variant.id} className="border-b hover:bg-gray-100">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={giftForm.productVariantIds.split(',').includes(variant.id)}
                        onChange={() => handleProductSelection(variant.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <img
                        src={getImageUrl(variant.image) || '/placeholder.png'}
                        alt={variant.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    </td>
                    <td className="px-4 py-3">{variant.name || variant.id}</td>
                    <td className="px-4 py-3">{variant.stock || 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-4 py-3 text-center">
                    Không tìm thấy sản phẩm
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => setIsProductModalOpen(false)}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Hủy
          </button>
          <button
            onClick={() => setIsProductModalOpen(false)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Xác nhận
          </button>
        </div>
      </Modal>

      {/* Modal chọn quà tặng */}
      <Modal
        isOpen={isGiftModalOpen}
        onRequestClose={() => setIsGiftModalOpen(false)}
        style={modalStyles}
      >
        <h2 className="text-lg font-semibold mb-4">Chọn quà tặng</h2>
        <input
          type="text"
          value={searchTermGift}
          onChange={(e) => setSearchTermGift(e.target.value)}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          placeholder="Tìm kiếm quà tặng..."
        />
        <div className="max-h-80 overflow-y-auto border rounded">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3">Chọn</th>
                <th className="px-4 py-3">Hình ảnh</th>
                <th className="px-4 py-3">Tên biến thể</th>
                <th className="px-4 py-3">Số lượng</th>
              </tr>
            </thead>
            <tbody>
              {filteredGiftVariants.length > 0 ? (
                filteredGiftVariants.map((variant) => (
                  <tr
                    key={variant.id}
                    className="border-b hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleGiftSelection(variant.id)}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="radio"
                        name="giftVariant"
                        checked={giftForm.productVariantId === variant.id}
                        onChange={() => handleGiftSelection(variant.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <img
                        src={getImageUrl(variant.image) || '/placeholder.png'}
                        alt={variant.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    </td>
                    <td className="px-4 py-3">{variant.name || variant.id}</td>
                    <td className="px-4 py-3">{variant.stock || 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-4 py-3 text-center">
                    Không tìm thấy quà tặng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => setIsGiftModalOpen(false)}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Hủy
          </button>
          <button
            onClick={() => setIsGiftModalOpen(false)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Xác nhận
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AddGift;
