'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Upload, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import api from '../../service/api';
import { getImageUrl } from '../../common/commonFunc';

const UpdateBrand = () => {
  const { brandId } = useParams();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
  } = useForm({
    defaultValues: {
      logo: null,
      name: '',
    },
    mode: 'onChange',
  });

  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingBrand, setLoadingBrand] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!brandId) {
        setError('form', { message: 'Brand ID is missing' });
        setLoadingBrand(false);
        return;
      }
      setLoadingBrand(true);
      try {
        const res = await api.get(`/brand/${brandId}`);
        const brand = res.data.result;
        setValue('name', brand.name || '');
        if (brand.image) {
          setPreviewUrl(brand.image); // giữ nguyên tên ảnh từ server
        }
      } catch (err) {
        console.error(err.response?.data?.message || 'Lỗi lấy danh sách sản phẩm');
        setError('form', {
          message:
            err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.',
        });
      }
      setLoadingBrand(false);
    };

    fetchData();
  }, [brandId, setValue, setError]);

  const handleImageChange = (e) => {
    clearErrors(['form', 'logo']);
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/png', 'image/jpeg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('logo', { message: 'Chỉ chấp nhận định dạng PNG, JPG, GIF' });
        setPreviewUrl('');
        setValue('logo', null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('logo', { message: 'Hình ảnh không được vượt quá 10MB' });
        setPreviewUrl('');
        setValue('logo', null);
        return;
      }

      setValue('logo', file);
      clearErrors('logo');

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result); // Data URL preview
      };
      reader.readAsDataURL(file);
    } else {
      setValue('logo', null);
      setPreviewUrl('');
    }
  };

  const removeImage = () => {
    clearErrors('form');
    setValue('logo', null);
    setPreviewUrl('');
  };

  const onSubmit = async (data) => {
    if (!data.logo && !previewUrl) {
      setError('logo', { message: 'Hình ảnh thương hiệu là bắt buộc' });
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.logo && typeof data.logo !== 'string') {
      formData.append('image', data.logo);
    }

    try {
      await api.put(`/brand/${brandId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      window.history.back();
    } catch (err) {
      console.error('Update error:', err);
      setError('form', {
        message:
          err.response?.data?.message ||
          'Có lỗi xảy ra khi cập nhật thương hiệu. Vui lòng thử lại.',
      });
    }
    setIsLoading(false);
  };

  const getPreviewImage = (url) => {
    if (!url) return '/placeholder.svg';
    if (url.startsWith('data:')) return url;
    return getImageUrl(url);
  };

  if (loadingBrand) {
    return (
      <div className="p-3 sm:p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 bg-[var(--color-bg)] min-h-screen">
      <div className="mb-6">
        <button
          onClick={() => window.history.back()}
          className="shadow-md px-4 py-2 text-sm bg-rose-50 text-gray-700 rounded-sm hover:bg-rose-100 flex items-center cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          QUẢN LÝ THƯƠNG HIỆU
        </button>
      </div>

      <div className="bg-white rounded-sm shadow-md">
        <div className="bg-[var(--color-title)] text-white p-4 rounded-t-sm">
          <h2 className="text-lg font-semibold">CẬP NHẬT THƯƠNG HIỆU</h2>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên thương hiệu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('name', {
                      required: 'Tên thương hiệu là bắt buộc',
                      minLength: { value: 2, message: 'Tên thương hiệu phải có ít nhất 2 ký tự' },
                    })}
                    placeholder="Tên thương hiệu"
                    className={`w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hình ảnh thương hiệu <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-sm p-6 text-center hover:border-gray-400 ${
                      errors.logo ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {previewUrl ? (
                      <div className="relative">
                        <img
                          src={getPreviewImage(previewUrl)}
                          alt="Preview"
                          className="mx-auto max-w-full max-h-48 object-contain rounded"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 cursor-pointer"
                          disabled={isLoading}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <div className="text-gray-600 mb-2">Kéo thả ảnh vào đây hoặc</div>
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <span className="bg-blue-500 text-white px-4 py-2 rounded-sm hover:bg-blue-600 inline-block">
                            Chọn ảnh
                          </span>
                          <input
                            id="image-upload"
                            type="file"
                            accept="image/png,image/jpeg,image/gif"
                            onChange={handleImageChange}
                            className="hidden"
                            disabled={isLoading}
                          />
                        </label>
                        <div className="text-gray-400 text-sm mt-2">PNG, JPG, GIF tối đa 10MB</div>
                      </div>
                    )}
                  </div>
                  {errors.logo && (
                    <p className="text-red-500 text-sm mt-1">{errors.logo.message}</p>
                  )}
                </div>
              </div>
            </div>

            {errors.form && (
              <div className="bg-red-50 border border-red-200 rounded-sm p-3 mt-4">
                <p className="text-red-600 text-sm">{errors.form.message}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-2 bg-gray-500 text-white rounded-sm hover:bg-gray-600 cursor-pointer"
                disabled={isLoading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-pink-500 text-white rounded-sm hover:bg-pink-600 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    CẬP NHẬT
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateBrand;
