'use client';

import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Upload, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import Modal from 'react-modal';
import api from '../../service/api';
import { getImageUrl } from '../../common/commonFunc';
import { useParams } from 'react-router-dom';

// Bind modal to app element for accessibility
Modal.setAppElement('#root');

const UpdateGift = () => {
  const { giftId } = useParams();
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
  const [searchTermProducts, setSearchTermProducts] = useState('');
  const [selectedGiftVariant, setSelectedGiftVariant] = useState(null);
  const [isStartDayEditable, setIsStartDayEditable] = useState(true);
  const [originalStartDay, setOriginalStartDay] = useState('');

  // Hàm chuyển đổi ngày giờ sang múi giờ Việt Nam (UTC+7)
  const formatToVietnamTime = (date) => {
    const vietnamTime = new Date(date);
    vietnamTime.setHours(vietnamTime.getHours() + 7);
    return vietnamTime.toISOString().slice(0, 16);
  };

  // Hàm chuyển đổi ngày giờ từ múi giờ Việt Nam về UTC
  const convertToUTC = (localDate) => {
    const date = new Date(localDate);
    date.setHours(date.getHours() - 7);
    return date.toISOString();
  };

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

  // Fetch gift data
  const fetchGiftData = useCallback(async () => {
    if (!giftId) return;
    try {
      setLoading(true);
      const response = await api.get(`/gift/${giftId}`);
      if (response.data.result) {
        const gift = response.data.result;
        console.log('Gift data:', response.data.result);

        // Xử lý chuỗi product_variant_ids thành mảng
        const productVariantIdsArray = gift.product_variant_ids
          .split(',')
          .map((id) => id.trim())
          .filter((id) => id);

        // Thiết lập giá trị cho form
        setValue('productVariantIds', productVariantIdsArray);
        setValue('productVariantId', gift.product_variant_id);
        setValue('stock', gift.stock.toString());
        setValue('startDay', formatToVietnamTime(gift.start_day));
        setValue('endDay', formatToVietnamTime(gift.end_day));

        // Lưu startDay gốc
        setOriginalStartDay(gift.start_day);

        // Kiểm tra nếu startDay nhỏ hơn thời điểm hiện tại thì không cho chỉnh sửa
        const now = new Date();
        if (new Date(gift.start_day) < now) {
          setIsStartDayEditable(false);
        }

        // Lưu thông tin quà tặng để hiển thị
        setSelectedGiftVariant({
          id: gift.product_variant_id,
          name: gift.name,
          image: gift.image,
          attribute_values: gift.attribute_values,
        });
      } else {
        setErrorMessage(response?.data?.message || 'Không thể tải dữ liệu quà tặng');
      }
    } catch (error) {
      console.error('Error fetching gift data:', error);
      setErrorMessage(error.response?.data?.message || 'Lỗi kết nối API');
    } finally {
      setLoading(false);
    }
  }, [giftId, setValue]);

  // Initialize form validation
  useEffect(() => {
    register('productVariantIds', {
      validate: (value) => (value.length > 0 ? true : 'Phải chọn ít nhất một sản phẩm có quà tặng'),
    });
    register('productVariantId', {
      required: 'Vui lòng chọn quà tặng',
    });
    register('startDay', {
      required: 'Ngày bắt đầu là bắt buộc',
      validate: (value) => {
        if (isStartDayEditable) {
          const now = new Date();
          return new Date(value) >= now || 'Ngày bắt đầu không được nhỏ hơn thời điểm hiện tại';
        }
        return true;
      },
    });
    register('endDay', {
      required: 'Ngày kết thúc là bắt buộc',
      validate: (value) => {
        const now = new Date();
        const startDay = control._formValues.startDay || originalStartDay;
        if (new Date(value) < now) {
          return 'Ngày kết thúc không được nhỏ hơn thời điểm hiện tại';
        }
        return (
          !startDay ||
          new Date(value) >= new Date(startDay) ||
          'Ngày kết thúc không được nhỏ hơn ngày bắt đầu'
        );
      },
    });
  }, [register, control, isStartDayEditable, originalStartDay]);

  // Load product variants and gift data on mount
  useEffect(() => {
    fetchProductVariants();
    fetchGiftData();
  }, [fetchProductVariants, fetchGiftData]);

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

  // Filter product variants
  const filteredProductVariants = productVariants.filter((variant) =>
    variant.name.toLowerCase().includes(searchTermProducts.toLowerCase()),
  );

  // Get selected product variants for display
  const selectedProductVariants = productVariants.filter((variant) =>
    control._formValues.productVariantIds.includes(variant.id),
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

      // Kiểm tra nếu startDay không chỉnh sửa được, sử dụng giá trị gốc
      const finalStartDay = isStartDayEditable ? convertToUTC(data.startDay) : originalStartDay;

      if (isStartDayEditable) {
        const now = new Date();
        if (new Date(data.startDay) < now) {
          setError('startDay', {
            type: 'manual',
            message: 'Ngày bắt đầu không được nhỏ hơn thời điểm hiện tại',
          });
          return;
        }
      }

      const now = new Date();
      if (new Date(data.endDay) < now) {
        setError('endDay', {
          type: 'manual',
          message: 'Ngày kết thúc không được nhỏ hơn thời điểm hiện tại',
        });
        return;
      }

      if (new Date(data.endDay) < new Date(isStartDayEditable ? data.startDay : originalStartDay)) {
        setError('endDay', {
          type: 'manual',
          message: 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu',
        });
        return;
      }

      const payload = {
        product_variant_ids: data.productVariantIds.join(','),
        product_variant_id: data.productVariantId,
        stock: parseInt(data.stock),
        start_day: finalStartDay,
        end_day: convertToUTC(data.endDay),
      };

      console.log('Payload:', payload);
      await api.put(`/gift/${giftId}`, payload);
      Swal.fire({
        title: 'Thành công',
        text: 'Đã cập nhật quà tặng thành công!',
        icon: 'success',
        confirmButtonColor: '#22c55e',
      });

      reset();
      window.history.back();
    } catch (error) {
      console.error('Error updating gift:', error);
      setErrorMessage(error.response?.data?.message || 'Lỗi khi cập nhật quà tặng');
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

  // Handle delete gift
  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa quà tặng này? Hành động này không thể hoàn tác!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await api.delete(`/gift/${giftId}`);
        Swal.fire({
          title: 'Thành công',
          text: 'Đã xóa quà tặng thành công!',
          icon: 'success',
          confirmButtonColor: '#22c55e',
        });
        window.history.back();
      } catch (error) {
        console.error('Error deleting gift:', error);
        setErrorMessage(error.response?.data?.message || 'Lỗi khi xóa quà tặng');
        Swal.fire({
          title: 'Lỗi',
          text: error.response?.data?.message || 'Lỗi khi xóa quà tặng',
          icon: 'error',
          confirmButtonColor: '#ef4444',
        });
      } finally {
        setLoading(false);
      }
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

  // Get current date for min attribute
  const today = new Date();
  today.setHours(today.getHours() + 7); // Điều chỉnh sang UTC+7
  const minDate = today.toISOString().slice(0, 16);

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
          <h2 className="text-lg font-semibold">CẬP NHẬT QUÀ TẶNG</h2>
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
                  Quà tặng <span className="text-red-500">*</span>
                </label>
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
                      <div className="text-gray-400 text-sm">Đang tải thông tin quà tặng...</div>
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
                      if (isStartDayEditable) {
                        const now = new Date();
                        return (
                          new Date(value) >= now ||
                          'Ngày bắt đầu không được nhỏ hơn thời điểm hiện tại'
                        );
                      }
                      return true;
                    },
                  })}
                  min={isStartDayEditable ? minDate : undefined}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    errors.startDay ? 'border-red-600' : 'border-gray-300'
                  } ${!isStartDayEditable ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  disabled={loading || !isStartDayEditable}
                />
                {errors.startDay && (
                  <p className="text-red-500 text-sm mt-1">{errors.startDay.message}</p>
                )}
                {!isStartDayEditable && (
                  <p className="text-gray-500 text-sm mt-1">
                    Ngày bắt đầu không thể chỉnh sửa vì quà tặng đã được áp dụng từ trước.
                  </p>
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
                      const now = new Date();
                      const startDay = control._formValues.startDay || originalStartDay;
                      if (new Date(value) < now) {
                        return 'Ngày kết thúc không được nhỏ hơn thời điểm hiện tại';
                      }
                      return (
                        !startDay ||
                        new Date(value) >= new Date(startDay) ||
                        'Ngày kết thúc không được nhỏ hơn ngày bắt đầu'
                      );
                    },
                  })}
                  min={minDate}
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
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-sm hover:bg-red-600 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa
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
                  'CẬP NHẬT QUÀ TẶNG'
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
    </div>
  );
};

export default UpdateGift;
