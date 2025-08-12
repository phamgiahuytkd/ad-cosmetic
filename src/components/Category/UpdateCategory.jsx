'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Upload, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import api from '../../service/api';
import { getImageUrl } from '../../common/commonFunc';

const UpdateCategory = () => {
  const { categoryId } = useParams();
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
      displayOrder: '',
      parentId: '',
    },
    mode: 'onChange',
  });

  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!categoryId) {
        setError('form', { message: 'Category ID is missing' });
        setLoadingCategory(false);
        return;
      }

      setLoadingCategory(true);
      try {
        const res = await api.get(`/category/${categoryId}`);
        const category = res.data.result;
        setValue('name', category.name || '');
        if (category.image) {
          setPreviewUrl(category.image); // giữ nguyên tên file từ server
        }
      } catch (err) {
        setError('form', {
          message:
            err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.',
        });
      }
      setLoadingCategory(false);
    };

    fetchData();
  }, [categoryId, setValue, setError]);

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
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
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
      setError('logo', { message: 'Hình ảnh danh mục là bắt buộc' });
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.logo && typeof data.logo !== 'string') {
      formData.append('image', data.logo);
    }

    try {
      await api.put(`/category/${categoryId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      window.history.back();
    } catch (err) {
      setError('form', {
        message:
          err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật danh mục. Vui lòng thử lại.',
      });
    }
    setIsLoading(false);
  };

  const handleInputChange = () => {
    clearErrors('form');
  };

  if (loadingCategory) {
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
    <div className="p-3 sm:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-sm hover:bg-gray-300 flex items-center cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          QUẢN LÝ DANH MỤC
        </button>
      </div>

      <div className="bg-white rounded-sm shadow-md">
        <div className="bg-[#00D5BE] text-white p-4 rounded-t-sm">
          <h2 className="text-lg font-semibold">CẬP NHẬT DANH MỤC</h2>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên danh mục <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('name', {
                      required: 'Tên danh mục là bắt buộc',
                      minLength: { value: 2, message: 'Tên danh mục phải có ít nhất 2 ký tự' },
                    })}
                    placeholder="Tên danh mục"
                    className={`w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                    onChange={handleInputChange}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hình ảnh danh mục <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-sm p-6 text-center hover:border-gray-400 ${
                      errors.logo ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {previewUrl ? (
                      <div className="relative">
                        <img
                          src={getImageUrl(previewUrl)}
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
                    <Plus className="w-4 h-4 mr-2" />
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

export default UpdateCategory;
