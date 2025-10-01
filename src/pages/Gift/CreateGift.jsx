'use client';

import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import Modal from 'react-modal';
import api from '../../service/api';
import { getImageUrl } from '../../common/commonFunc';

// Bind modal to app element for accessibility
Modal.setAppElement('#root');

const CreateGift = () => {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
    reset,
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      productVariantIds: [],
      productVariantId: '',
      stock: '',
      startDay: '',
      endDay: '',
    },
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [productVariants, setProductVariants] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [searchTermProducts, setSearchTermProducts] = useState('');
  const [searchTermGift, setSearchTermGift] = useState('');

  // Fetch product variants
  const fetchProductVariants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/product-variant');
      if (response.data.result) {
        setProductVariants(response.data.result);
      } else {
        setErrorMessage(response?.data?.message || 'Không thể tải danh sách biến thể sản phẩm');
      }
    } catch (error) {
      console.error('Error fetching product variants:', error);
      setErrorMessage(error.response?.data?.message || 'Lỗi kết nối API');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize form validation
  useEffect(() => {
    register('productVariantIds', {
      validate: (value) => (value.length > 0 ? true : 'Phải chọn ít nhất một sản phẩm có quà tặng'),
    });
    register('productVariantId', {
      required: 'Vui lòng chọn quà tặng',
    });
  }, [register]);

  // Load product variants on mount
  useEffect(() => {
    fetchProductVariants();
  }, [fetchProductVariants]);

  // Handle product selection
  const handleProductSelection = (id) => {
    const currentIds = control._formValues.productVariantIds || [];
    const newIds = currentIds.includes(id)
      ? currentIds.filter((item) => item !== id)
      : [...currentIds, id];

    setValue('productVariantIds', newIds);
    clearErrors('productVariantIds');
  };

  // Handle unselect all products
  const handleUnselectAllProducts = () => {
    setValue('productVariantIds', []);
    setError('productVariantIds', {
      message: 'Phải chọn ít nhất một sản phẩm có quà tặng',
    });
  };

  // Handle select all products
  const handleSelectAllProducts = () => {
    const filteredIds = filteredProductVariants.map((variant) => variant.id);
    const currentIds = control._formValues.productVariantIds || [];
    const allSelected = filteredIds.every((id) => currentIds.includes(id));

    const newIds = allSelected
      ? currentIds.filter((id) => !filteredIds.includes(id))
      : [...new Set([...currentIds, ...filteredIds])];

    setValue('productVariantIds', newIds);
    clearErrors('productVariantIds');
  };

  // Handle gift selection
  const handleGiftSelection = (id) => {
    setValue('productVariantId', id);
    clearErrors('productVariantId');
    setIsGiftModalOpen(false);
  };

  // Filter product variants
  const filteredProductVariants = productVariants.filter((variant) =>
    variant.name.toLowerCase().includes(searchTermProducts.toLowerCase()),
  );
  const filteredGiftVariants = productVariants.filter((variant) =>
    variant.name.toLowerCase().includes(searchTermGift.toLowerCase()),
  );

  // Get selected product variants for display
  const selectedProductVariants = productVariants.filter((variant) =>
    control._formValues.productVariantIds.includes(variant.id),
  );
  const selectedGiftVariant = productVariants.find(
    (variant) => variant.id === control._formValues.productVariantId,
  );

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setErrorMessage('');

      const giftVariant = productVariants.find((v) => v.id === data.productVariantId);
      if (giftVariant && parseInt(data.stock) > (giftVariant.stock || 0)) {
        setError('stock', {
          type: 'manual',
          message: 'Số lượng quà tặng không được lớn hơn số lượng tồn kho của quà tặng',
        });
        return;
      }

      if (new Date(data.startDay) > new Date(data.endDay)) {
        setError('endDay', {
          type: 'manual',
          message: 'Ngày kết thúc phải sau ngày bắt đầu',
        });
        return;
      }

      const payload = {
        product_variant_ids: data.productVariantIds.join(','),
        product_variant_id: data.productVariantId,
        stock: parseInt(data.stock),
        start_day: data.startDay,
        end_day: data.endDay,
      };

      await api.post('/gift', payload);
      Swal.fire({
        title: 'Thành công',
        text: 'Đã thêm quà tặng thành công!',
        icon: 'success',
        confirmButtonColor: '#22c55e',
      });

      reset();
      window.history.back();
    } catch (error) {
      console.error('Error adding gift:', error);
      setErrorMessage(error.response?.data?.message || 'Lỗi khi thêm quà tặng');
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

  // Modal styles
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
    <div className="p-3 sm:p-6 bg-[var(--color-bg)] min-h-screen">
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-sm">{errorMessage}</div>
      )}
      <div className="mb-6">
        <button
          onClick={() => window.history.back()}
          className="shadow-md px-4 py-2 text-sm bg-rose-50 text-gray-700 rounded-sm hover:bg-rose-100 flex items-center"
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          QUẢN LÝ QUÀ TẶNG
        </button>
      </div>

      <div className="bg-white rounded-sm shadow-md">
        <div className="bg-[var(--color-title)] text-white p-4 rounded-t-sm">
          <h2 className="text-lg font-semibold">THÊM QUÀ TẶNG</h2>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn sản phẩm có quà tặng <span className="text-red-500">*</span>
                </label>
                <div className="flex justify-between items-center mb-3">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600"
                    disabled={loading}
                  >
                    Chọn sản phẩm
                  </button>
                  {selectedProductVariants.length > 0 && (
                    <button
                      type="button"
                      onClick={handleUnselectAllProducts}
                      className="px-4 py-2 bg-red-500 text-white rounded-sm hover:bg-red-600"
                      disabled={loading}
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>
                <div
                  className={`border-2 border-dashed rounded-sm p-6 w-full ${
                    errors.productVariantIds ? 'border-red-600' : 'border-gray-300'
                  } ${selectedProductVariants.length > 5 ? 'max-h-64 overflow-y-auto' : ''}`}
                >
                  {selectedProductVariants.length > 0 ? (
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th className="px-4 py-2">Hình ảnh</th>
                          <th className="px-4 py-2">Tên biến thể</th>
                          <th className="px-4 py-2">Thuộc tính</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProductVariants.map((variant) => (
                          <tr key={variant.id} className="border-b">
                            <td className="px-4 py-2">
                              <img
                                src={getImageUrl(variant.image) || '/placeholder.png'}
                                alt={variant.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            </td>
                            <td className="px-4 py-2">{variant.name || variant.id}</td>
                            <td className="px-4 py-2">
                              {variant.attribute_values
                                ? variant.attribute_values
                                    .map((a) => `${a.attribute_id}: ${a.id}`)
                                    .join(', ')
                                : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <div className="text-gray-400 text-sm">Chọn các sản phẩm sẽ kèm quà tặng</div>
                    </div>
                  )}
                </div>
                {errors.productVariantIds && (
                  <p className="text-red-500 text-sm mt-1">{errors.productVariantIds.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn quà tặng <span className="text-red-500">*</span>
                </label>
                <div className="flex justify-between items-center mb-3">
                  <button
                    type="button"
                    onClick={() => setIsGiftModalOpen(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600"
                    disabled={loading}
                  >
                    Chọn quà tặng
                  </button>
                </div>
                <div
                  className={`border-2 border-dashed rounded-sm p-6 w-full ${
                    errors.productVariantId ? 'border-red-600' : 'border-gray-300'
                  }`}
                >
                  {selectedGiftVariant ? (
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th className="px-4 py-2">Hình ảnh</th>
                          <th className="px-4 py-2">Tên biến thể</th>
                          <th className="px-4 py-2">Thuộc tính</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="px-4 py-2">
                            <img
                              src={getImageUrl(selectedGiftVariant.image) || '/placeholder.png'}
                              alt={selectedGiftVariant.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          </td>
                          <td className="px-4 py-2">
                            {selectedGiftVariant.name || selectedGiftVariant.id}
                          </td>
                          <td className="px-4 py-2">
                            {selectedGiftVariant.attribute_values
                              ? selectedGiftVariant.attribute_values
                                  .map((a) => `${a.attribute_id}: ${a.id}`)
                                  .join(', ')
                              : 'N/A'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <div className="text-gray-400 text-sm">Chọn sản phẩm làm quà tặng</div>
                    </div>
                  )}
                </div>
                {errors.productVariantId && (
                  <p className="text-red-500 text-sm mt-1">{errors.productVariantId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng tồn kho <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register('stock', {
                    required: 'Số lượng tồn kho là bắt buộc',
                    min: { value: 0, message: 'Số lượng tồn kho không được âm' },
                  })}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    errors.stock ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder="Nhập số lượng tồn kho"
                  disabled={loading}
                />
                {errors.stock && (
                  <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  {...register('startDay', {
                    required: 'Ngày bắt đầu là bắt buộc',
                    validate: (value) => {
                      const now = new Date();
                      return new Date(value) >= now || 'Ngày bắt đầu phải từ hiện tại trở đi';
                    },
                  })}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    errors.startDay ? 'border-red-600' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.startDay && (
                  <p className="text-red-500 text-sm mt-1">{errors.startDay.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày kết thúc <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  {...register('endDay', {
                    required: 'Ngày kết thúc là bắt buộc',
                    validate: (value) => {
                      const startDay = control._formValues.startDay;
                      return (
                        !startDay ||
                        new Date(value) > new Date(startDay) ||
                        'Ngày kết thúc phải sau ngày bắt đầu'
                      );
                    },
                  })}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    errors.endDay ? 'border-red-600' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.endDay && (
                  <p className="text-red-500 text-sm mt-1">{errors.endDay.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-gray-500 text-white rounded-sm hover:bg-gray-600"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                    Đang xử lý...
                  </>
                ) : (
                  'THÊM QUÀ TẶNG'
                )}
              </button>
            </div>
          </form>
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
                        control._formValues.productVariantIds.includes(variant.id),
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3">Hình ảnh</th>
                <th className="px-4 py-3">Tên biến thể</th>
                <th className="px-4 py-3">Thuộc tính</th>
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
                        checked={control._formValues.productVariantIds.includes(variant.id)}
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
                    <td className="px-4 py-3">
                      {variant.attribute_values
                        ? variant.attribute_values
                            .map((a) => `${a.attribute_id}: ${a.id}`)
                            .join(', ')
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-3">{variant.stock || 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-center">
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
                <th className="px-4 py-3">Thuộc tính</th>
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
                        checked={control._formValues.productVariantId === variant.id}
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
                    <td className="px-4 py-3">
                      {variant.attribute_values
                        ? variant.attribute_values
                            .map((a) => `${a.attribute_id}: ${a.id}`)
                            .join(', ')
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-3">{variant.stock || 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-center">
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

export default CreateGift;
