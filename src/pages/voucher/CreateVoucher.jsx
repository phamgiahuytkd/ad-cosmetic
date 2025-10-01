'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import Swal from 'sweetalert2';
import api from '../../service/api';

// Bind modal to app element for accessibility (if modals are used in the future)
import Modal from 'react-modal';
Modal.setAppElement('#root');

const CreateVoucher = () => {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors },
    reset,
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      code: '',
      description: '',
      voucher_type: '',
      percent: 100, // Set default value to 100
      max_amount: '',
      min_order_amount: '',
      start_day: '',
      end_day: '',
      usage_limit: '',
    },
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Watch voucher_type to dynamically handle percent field
  const voucherType = useWatch({ control, name: 'voucher_type' });

  // Number formatter for Vietnamese locale
  const formatter = new Intl.NumberFormat('vi-VN');

  // Handle number input formatting
  const handleNumberInput = (e, fieldName) => {
    let value = e.target.value.replace(/[^0-9]/g, ''); // Remove non-numeric characters
    if (value) {
      const numValue = parseInt(value, 10);
      setValue(fieldName, numValue, { shouldValidate: true });
      e.target.value = formatter.format(numValue); // Format with commas
    } else {
      setValue(fieldName, '', { shouldValidate: true });
      e.target.value = '';
    }
  };

  // Prevent mouse wheel scrolling on number inputs
  const disableScroll = (e) => {
    e.target.blur(); // Remove focus to prevent scrolling
  };

  // Set percent based on voucher_type
  useEffect(() => {
    if (voucherType === 'FIXED_AMOUNT') {
      setValue('percent', 100, { shouldValidate: true });
    } else if (voucherType === 'PERCENTAGE') {
      setValue('percent', 1, { shouldValidate: true }); // Reset to 1 for PERCENTAGE
    }
    // Do not set percent when voucher_type is empty to keep default 100
  }, [voucherType, setValue]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setErrorMessage('');

      // Validate percent
      if (parseFloat(data.percent) <= 0 || parseFloat(data.percent) > 100) {
        setError('percent', {
          type: 'manual',
          message: 'Mức giảm giá phải từ 1 đến 100%',
        });
        return;
      }

      // Validate max_amount and min_order_amount
      if (parseFloat(data.max_amount) < 0) {
        setError('max_amount', {
          type: 'manual',
          message: 'Giá trị giảm tối đa không được âm',
        });
        return;
      }
      if (parseFloat(data.min_order_amount) < 0) {
        setError('min_order_amount', {
          type: 'manual',
          message: 'Giá trị đơn hàng tối thiểu không được âm',
        });
        return;
      }

      // Validate dates
      if (new Date(data.start_day) < new Date()) {
        setError('start_day', {
          type: 'manual',
          message: 'Ngày bắt đầu phải từ hiện tại trở đi',
        });
        return;
      }
      if (new Date(data.start_day) > new Date(data.end_day)) {
        setError('end_day', {
          type: 'manual',
          message: 'Ngày kết thúc phải sau ngày bắt đầu',
        });
        return;
      }

      // Validate usage_limit
      if (parseInt(data.usage_limit) < 1) {
        setError('usage_limit', {
          type: 'manual',
          message: 'Giới hạn sử dụng phải lớn hơn 0',
        });
        return;
      }

      const payload = {
        code: data.code,
        description: data.description,
        voucher_type: data.voucher_type,
        percent: parseFloat(data.percent),
        max_amount: parseFloat(data.max_amount),
        min_order_amount: parseFloat(data.min_order_amount),
        start_day: data.start_day,
        end_day: data.end_day,
        usage_limit: parseInt(data.usage_limit),
      };

      await api.post('/voucher', payload);
      Swal.fire({
        title: 'Thành công',
        text: 'Đã thêm mã giảm giá thành công!',
        icon: 'success',
        confirmButtonColor: '#22c55e',
      });

      reset();
      window.history.back();
    } catch (error) {
      console.error('Error adding voucher:', error);
      setErrorMessage(error.response?.data?.message || 'Lỗi khi thêm mã giảm giá');
      Swal.fire({
        title: 'Lỗi',
        text: error.response?.data?.message || 'Lỗi khi thêm mã giảm giá',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setLoading(false);
    }
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
          QUẢN LÝ MÃ GIẢM GIÁ
        </button>
      </div>

      <div className="bg-white rounded-sm shadow-md">
        <div className="bg-[var(--color-title)] text-white p-4 rounded-t-sm">
          <h2 className="text-lg font-semibold">THÊM MÃ GIẢM GIÁ</h2>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã giảm giá <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('code', {
                    required: 'Mã giảm giá là bắt buộc',
                    pattern: {
                      value: /^[A-Z0-9]{4,20}$/,
                      message: 'Mã giảm giá phải là chữ in hoa hoặc số, từ 4 đến 20 ký tự',
                    },
                  })}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    errors.code ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder="Nhập mã giảm giá (ví dụ: SUMMER25)"
                  disabled={loading}
                />
                {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                <textarea
                  {...register('description')}
                  className="w-full px-3 py-2 border rounded-sm border-gray-300"
                  placeholder="Nhập mô tả mã giảm giá"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại mã giảm giá <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('voucher_type', {
                    required: 'Loại mã giảm giá là bắt buộc',
                  })}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    errors.voucher_type ? 'border-red-600' : 'border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <option value="">Chọn loại mã giảm giá</option>
                  <option value="PERCENTAGE">Phần trăm</option>
                  <option value="FIXED_AMOUNT">Số tiền cố định</option>
                </select>
                {errors.voucher_type && (
                  <p className="text-red-500 text-sm mt-1">{errors.voucher_type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mức giảm giá (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register('percent', {
                    required: 'Mức giảm giá là bắt buộc',
                    min: { value: 1, message: 'Mức giảm giá phải lớn hơn 0' },
                    max: { value: 100, message: 'Mức giảm giá không được vượt quá 100%' },
                  })}
                  onWheel={disableScroll}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    errors.percent ? 'border-red-600' : 'border-gray-300'
                  } ${!voucherType || voucherType === 'FIXED_AMOUNT' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Nhập mức giảm giá (1-100)"
                  disabled={loading || !voucherType || voucherType === 'FIXED_AMOUNT'}
                />
                {errors.percent && (
                  <p className="text-red-500 text-sm mt-1">{errors.percent.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá trị giảm tối đa (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('max_amount', {
                    required: 'Giá trị giảm tối đa là bắt buộc',
                    validate: (value) =>
                      value !== '' && parseFloat(value) >= 0
                        ? true
                        : 'Giá trị giảm tối đa không được âm',
                  })}
                  onWheel={disableScroll}
                  onChange={(e) => handleNumberInput(e, 'max_amount')}
                  onFocus={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    e.target.value = value || '';
                  }}
                  onBlur={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value) {
                      e.target.value = formatter.format(parseInt(value, 10));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    errors.max_amount ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder="Nhập giá trị giảm tối đa"
                  disabled={loading}
                />
                {errors.max_amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.max_amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá trị đơn hàng tối thiểu (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('min_order_amount', {
                    required: 'Giá trị đơn hàng tối thiểu là bắt buộc',
                    validate: (value) =>
                      value !== '' && parseFloat(value) >= 0
                        ? true
                        : 'Giá trị đơn hàng tối thiểu không được âm',
                  })}
                  onWheel={disableScroll}
                  onChange={(e) => handleNumberInput(e, 'min_order_amount')}
                  onFocus={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    e.target.value = value || '';
                  }}
                  onBlur={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value) {
                      e.target.value = formatter.format(parseInt(value, 10));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    errors.min_order_amount ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder="Nhập giá trị đơn hàng tối thiểu"
                  disabled={loading}
                />
                {errors.min_order_amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.min_order_amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  {...register('start_day', {
                    required: 'Ngày bắt đầu là bắt buộc',
                    validate: (value) => {
                      const now = new Date();
                      return new Date(value) >= now || 'Ngày bắt đầu phải từ hiện tại trở đi';
                    },
                  })}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    errors.start_day ? 'border-red-600' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.start_day && (
                  <p className="text-red-500 text-sm mt-1">{errors.start_day.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày kết thúc <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  {...register('end_day', {
                    required: 'Ngày kết thúc là bắt buộc',
                    validate: (value) => {
                      const startDay = document.getElementsByName('start_day')[0]?.value;
                      return (
                        !startDay ||
                        new Date(value) > new Date(startDay) ||
                        'Ngày kết thúc phải sau ngày bắt đầu'
                      );
                    },
                  })}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    errors.end_day ? 'border-red-600' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.end_day && (
                  <p className="text-red-500 text-sm mt-1">{errors.end_day.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giới hạn sử dụng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('usage_limit', {
                    required: 'Giới hạn sử dụng là bắt buộc',
                    validate: (value) =>
                      value !== '' && parseInt(value) >= 1
                        ? true
                        : 'Giới hạn sử dụng phải lớn hơn 0',
                  })}
                  onWheel={disableScroll}
                  onChange={(e) => handleNumberInput(e, 'usage_limit')}
                  onFocus={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    e.target.value = value || '';
                  }}
                  onBlur={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value) {
                      e.target.value = formatter.format(parseInt(value, 10));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    errors.usage_limit ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder="Nhập giới hạn sử dụng"
                  disabled={loading}
                />
                {errors.usage_limit && (
                  <p className="text-red-500 text-sm mt-1">{errors.usage_limit.message}</p>
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
                  'THÊM MÃ GIẢM GIÁ'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateVoucher;
