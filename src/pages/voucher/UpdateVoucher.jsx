'use client';

import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../../service/api';

// Bind modal to app element for accessibility
import Modal from 'react-modal';
Modal.setAppElement('#root');

const UpdateVoucher = () => {
  const { voucherId } = useParams();
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors },
    reset,
    clearErrors,
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      code: '',
      description: '',
      voucher_type: '',
      percent: '',
      max_amount: '',
      min_order_amount: '',
      start_day: '',
      end_day: '',
      usage_limit: '',
    },
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isStartDayEditable, setIsStartDayEditable] = useState(true);
  const [originalStartDay, setOriginalStartDay] = useState('');

  // Watch voucher_type to dynamically handle percent field
  const voucherType = useWatch({ control, name: 'voucher_type' });

  // Number formatter for Vietnamese locale
  const formatter = new Intl.NumberFormat('vi-VN');

  // Handle number input formatting
  const handleNumberInput = (e, fieldName) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value) {
      const numValue = parseInt(value, 10);
      setValue(fieldName, numValue, { shouldValidate: true });
      e.target.value = formatter.format(numValue);
    } else {
      setValue(fieldName, '', { shouldValidate: true });
      e.target.value = '';
    }
  };

  // Prevent mouse wheel scrolling on number inputs
  const disableScroll = (e) => {
    e.target.blur();
  };

  // Hàm chuyển đổi ngày giờ sang múi giờ Việt Nam (UTC+7)
  const formatToVietnamTime = (date) => {
    const vietnamTime = new Date(date);
    vietnamTime.setHours(vietnamTime.getHours() + 7);
    return vietnamTime.toISOString().slice(0, 16);
  };

  // Set percent to 100 when voucher_type is FIXED_AMOUNT
  useEffect(() => {
    if (voucherType === 'FIXED_AMOUNT') {
      setValue('percent', 100, { shouldValidate: true });
      clearErrors('percent');
    } else if (voucherType === 'PERCENTAGE') {
      clearErrors('percent');
    }
  }, [voucherType, setValue, clearErrors]);

  // Fetch voucher data
  const fetchVoucherData = useCallback(async () => {
    if (!voucherId) return;
    try {
      setLoading(true);
      const response = await api.get(`/voucher/${voucherId}`);
      if (response.data.result) {
        const voucher = response.data.result;
        setValue('code', voucher.code);
        setValue('description', voucher.description || '');
        setValue('voucher_type', voucher.voucher_type);
        setValue('percent', voucher.percent.toString());
        setValue('max_amount', voucher.max_amount.toString());
        setValue('min_order_amount', voucher.min_order_amount.toString());
        setValue('start_day', formatToVietnamTime(voucher.start_day));
        setValue('end_day', formatToVietnamTime(voucher.end_day));
        setValue('usage_limit', voucher.usage_limit.toString());

        // Store original start_day
        setOriginalStartDay(voucher.start_day);

        // Check if start_day is in the past
        const now = new Date();
        if (new Date(voucher.start_day) < now) {
          setIsStartDayEditable(false);
        }
      } else {
        setErrorMessage(response?.data?.message || 'Không thể tải dữ liệu mã giảm giá');
      }
    } catch (error) {
      console.error('Error fetching voucher data:', error);
      setErrorMessage(error.response?.data?.message || 'Lỗi kết nối API');
    } finally {
      setLoading(false);
    }
  }, [voucherId, setValue]);

  // Load voucher data on mount
  useEffect(() => {
    fetchVoucherData();
  }, [fetchVoucherData]);

  // Handle delete voucher
  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa mã giảm giá này? Hành động này không thể hoàn tác!',
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
        await api.delete(`/voucher/${voucherId}`);
        Swal.fire({
          title: 'Thành công',
          text: 'Đã xóa mã giảm giá thành công!',
          icon: 'success',
          confirmButtonColor: '#22c55e',
        });
        window.history.back();
      } catch (error) {
        console.error('Error deleting voucher:', error);
        setErrorMessage(error.response?.data?.message || 'Lỗi khi xóa mã giảm giá');
        Swal.fire({
          title: 'Lỗi',
          text: error.response?.data?.message || 'Lỗi khi xóa mã giảm giá',
          icon: 'error',
          confirmButtonColor: '#ef4444',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setErrorMessage('');

      // Validate percent
      if (
        voucherType === 'PERCENTAGE' &&
        (!data.percent || parseFloat(data.percent) <= 0 || parseFloat(data.percent) > 100)
      ) {
        setError('percent', {
          type: 'manual',
          message: 'Mức giảm giá phải từ 1 đến 100% khi chọn loại phần trăm',
        });
        return;
      }
      if (voucherType === 'FIXED_AMOUNT' && parseFloat(data.percent) !== 100) {
        setError('percent', {
          type: 'manual',
          message: 'Mức giảm giá phải là 100% khi chọn loại số tiền cố định',
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
      const now = new Date();
      const finalStartDay = isStartDayEditable ? data.start_day : null;

      if (isStartDayEditable && new Date(data.start_day) < now) {
        setError('start_day', {
          type: 'manual',
          message: 'Ngày bắt đầu phải từ hiện tại trở đi',
        });
        return;
      }

      if (new Date(data.end_day) <= new Date(finalStartDay || originalStartDay)) {
        setError('end_day', {
          type: 'manual',
          message: 'Ngày kết thúc phải sau ngày bắt đầu',
        });
        return;
      }

      if (new Date(data.end_day) <= now) {
        setError('end_day', {
          type: 'manual',
          message: 'Ngày kết thúc phải từ hiện tại trở đi',
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

      // Chuyển đổi ngày giờ từ múi giờ Việt Nam về UTC trước khi gửi API
      const convertToUTC = (localDate) => {
        const date = new Date(localDate);
        date.setHours(date.getHours() - 7);
        return date.toISOString();
      };

      const payload = {
        code: data.code,
        description: data.description,
        voucher_type: data.voucher_type,
        percent: parseFloat(data.percent),
        max_amount: parseFloat(data.max_amount),
        min_order_amount: parseFloat(data.min_order_amount),
        start_day: isStartDayEditable ? convertToUTC(data.start_day) : null,
        end_day: convertToUTC(data.end_day),
        usage_limit: parseInt(data.usage_limit),
      };

      await api.put(`/voucher/${voucherId}`, payload);
      Swal.fire({
        title: 'Thành công',
        text: 'Đã cập nhật mã giảm giá thành công!',
        icon: 'success',
        confirmButtonColor: '#22c55e',
      });

      reset();
      window.history.back();
    } catch (error) {
      console.error('Error updating voucher:', error);
      setErrorMessage(error.response?.data?.message || 'Lỗi khi cập nhật mã giảm giá');
      Swal.fire({
        title: 'Lỗi',
        text: error.response?.data?.message || 'Lỗi khi cập nhật mã giảm giá',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setLoading(false);
    }
  };

  // Get current date for min attribute
  const today = new Date().toISOString().slice(0, 16);

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
          <h2 className="text-lg font-semibold">CẬP NHẬT MÃ GIẢM GIÁ</h2>
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
                    required: voucherType === 'PERCENTAGE' ? 'Mức giảm giá là bắt buộc' : false,
                    min:
                      voucherType === 'PERCENTAGE'
                        ? { value: 1, message: 'Mức giảm giá phải lớn hơn 0' }
                        : undefined,
                    max:
                      voucherType === 'PERCENTAGE'
                        ? { value: 100, message: 'Mức giảm giá không được vượt quá 100%' }
                        : undefined,
                    validate: (value) => {
                      if (voucherType === 'FIXED_AMOUNT' && parseFloat(value) !== 100) {
                        return 'Mức giảm giá phải là 100% khi chọn loại số tiền cố định';
                      }
                      return true;
                    },
                  })}
                  onWheel={disableScroll}
                  onChange={(e) => {
                    setValue('percent', e.target.value, { shouldValidate: true });
                    clearErrors('percent');
                  }}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    errors.percent ? 'border-red-600' : 'border-gray-300'
                  } ${voucherType === 'FIXED_AMOUNT' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Nhập mức giảm giá (1-100)"
                  disabled={loading || voucherType === 'FIXED_AMOUNT'}
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
                      if (isStartDayEditable) {
                        const now = new Date();
                        return new Date(value) >= now || 'Ngày bắt đầu phải từ hiện tại trở đi';
                      }
                      return true;
                    },
                  })}
                  min={isStartDayEditable ? today : undefined}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    errors.start_day ? 'border-red-600' : 'border-gray-300'
                  } ${!isStartDayEditable ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  disabled={loading || !isStartDayEditable}
                />
                {errors.start_day && (
                  <p className="text-red-500 text-sm mt-1">{errors.start_day.message}</p>
                )}
                {!isStartDayEditable && (
                  <p className="text-gray-500 text-sm mt-1">
                    Ngày bắt đầu không thể chỉnh sửa vì mã giảm giá đã được áp dụng từ trước.
                  </p>
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
                      const now = new Date();
                      const startDay = isStartDayEditable
                        ? control._formValues.start_day
                        : originalStartDay;
                      if (new Date(value) <= now) {
                        return 'Ngày kết thúc phải từ hiện tại trở đi';
                      }
                      return (
                        !startDay ||
                        new Date(value) > new Date(startDay) ||
                        'Ngày kết thúc phải sau ngày bắt đầu'
                      );
                    },
                  })}
                  min={today}
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
                className="px-4 py-2 bg-gray-500 text-white rounded-sm hover:bg-gray-600 flex items-center"
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
                  'CẬP NHẬT MÃ GIẢM GIÁ'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateVoucher;
