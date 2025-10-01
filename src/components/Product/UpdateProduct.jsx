'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Upload, X, Trash2, Edit2 } from 'lucide-react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import Select from 'react-select';
import Modal from 'react-modal';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../../service/api';
import AddAttributeModal from '../Modal/AddAttributeModal';
import UpdateAttributeValueModal from '../Modal/UpdateAttributeValueModal';
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaRegStopCircle } from 'react-icons/fa';
import { VscDebugContinue } from 'react-icons/vsc';

// Hàm xử lý URL ảnh
export const getImageUrl = (imageName) => {
  if (!imageName) return '';
  if (/^https?:\/\//.test(imageName)) {
    return imageName;
  }
  return `http://localhost:8080/iCommerce/images/${imageName}`;
};

// Bind modal to app element (for accessibility)
Modal.setAppElement('#root');

// Quill modules configuration
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

// Quill formats configuration
const quillFormats = ['header', 'bold', 'italic', 'underline', 'list', 'bullet', 'link'];

// CSS cho React Quill
const quillEditorStyle = {
  height: '400px',
};

// Component ProductItem
const ProductItem = ({
  itemIndex,
  control,
  register,
  errors,
  isLoading,
  removeProductItem,
  productItemsPreviews,
  setProductItemsPreviews,
  handleProductItemThumbChange,
  handleProductItemImageChange,
  setValue,
  setError,
  clearErrors,
  productItemsFields,
  attributeOptions,
  setAttributeOptions,
  setIsModalOpen,
  setIsUpdateValueModalOpen,
  appendAttributeToAllItems,
  removeAttributeFromAllItems,
  trigger,
  hasInitialPromotion,
  variant,
}) => {
  const {
    fields: attributes,
    append: appendAttribute,
    remove: removeAttribute,
  } = useFieldArray({
    control,
    name: `productItems[${itemIndex}].attributes`,
  });

  const {
    fields: promotions,
    append: appendPromotion,
    remove: removePromotion,
  } = useFieldArray({
    control,
    name: `productItems[${itemIndex}].promotions`,
  });

  useEffect(() => {
    if (attributes.length === 0 && itemIndex === 0) {
      appendAttribute({ code: '', value: '' });
    }
  }, [attributes.length, appendAttribute, itemIndex]);

  const selectedAttributeCodes = attributes
    .map((attr, idx) => control._formValues.productItems[itemIndex]?.attributes[idx]?.code)
    .filter(Boolean);

  const availableAttributeOptions = attributeOptions.filter(
    (option) => !selectedAttributeCodes.includes(option.value),
  );

  const handleDiscountChange = (promoIndex, field, value) => {
    const price = parseFloat(control._formValues.productItems[itemIndex]?.price) || 0;
    if (!price) {
      setError(`productItems[${itemIndex}].promotions[${promoIndex}].${field}`, {
        message: 'Vui lòng nhập giá chính trước',
      });
      return;
    }
    if (field === 'discountPrice' && value) {
      const discountPrice = parseFloat(value);
      if (discountPrice < 1) {
        setError(`productItems[${itemIndex}].promotions[${promoIndex}].discountPrice`, {
          message: 'Giá giảm phải lớn hơn hoặc bằng 1',
        });
        return;
      }
      if (discountPrice >= price) {
        setError(`productItems[${itemIndex}].promotions[${promoIndex}].discountPrice`, {
          message: 'Giá giảm phải nhỏ hơn giá chính',
        });
        return;
      }
      const discountPercent = Math.round(((price - discountPrice) / price) * 100);
      setValue(
        `productItems[${itemIndex}].promotions[${promoIndex}].discountPercent`,
        discountPercent.toString(),
      );
      clearErrors(`productItems[${itemIndex}].promotions[${promoIndex}].discountPercent`);
      clearErrors(`productItems[${itemIndex}].promotions[${promoIndex}].discountPrice`);
    } else if (field === 'discountPercent' && value) {
      const discountPercent = parseFloat(value);
      if (discountPercent > 100 || discountPercent < 0) {
        setError(`productItems[${itemIndex}].promotions[${promoIndex}].discountPercent`, {
          message: 'Phần trăm giảm giá phải từ 0 đến 100',
        });
        return;
      }
      const discountPrice = Math.round(price * (1 - discountPercent / 100));
      if (discountPrice < 1) {
        setError(`productItems[${itemIndex}].promotions[${promoIndex}].discountPrice`, {
          message: 'Giá giảm phải lớn hơn hoặc bằng 1',
        });
        return;
      }
      setValue(
        `productItems[${itemIndex}].promotions[${promoIndex}].discountPrice`,
        discountPrice.toString(),
      );
      clearErrors(`productItems[${itemIndex}].promotions[${promoIndex}].discountPercent`);
      clearErrors(`productItems[${itemIndex}].promotions[${promoIndex}].discountPrice`);
    }
    trigger(`productItems[${itemIndex}].promotions[${promoIndex}]`);
  };

  const [localPromotionVisible, setLocalPromotionVisible] = useState(hasInitialPromotion);
  const [isSelling, setIsSelling] = useState(!variant?.stop_day);

  const handleStopPromotion = async (id) => {
    const result = await Swal.fire({
      title: 'Xác nhận dừng khuyến mãi',
      text: 'Bạn có chắc muốn dừng khuyến mãi này không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Dừng khuyến mãi',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      try {
        await api.put(`/discount/${id}`); // Giả sử đây là API dừng khuyến mãi
        setLocalPromotionVisible(false);
        Swal.fire('Đã dừng!', `Khuyến mãi ${id} đã được dừng.`, 'success');
      } catch (error) {
        console.error(error);
        Swal.fire('Thất bại!', `Không thể dừng khuyến mãi ${id}.`, 'error');
      }
    }
  };

  const handleStopProductVariant = async (id) => {
    const result = await Swal.fire({
      title: 'Xác nhận dừng bán',
      text: 'Bạn có chắc muốn dừng bán sản phẩm này không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Dừng bán',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      try {
        await api.put(`/product-variant/${id}/stop`); // Giả sử đây là API dừng khuyến mãi
        setIsSelling(false);
        Swal.fire('Đã dừng!', `Sản phẩm ${id} đã dừng bán.`, 'success');
      } catch (error) {
        console.error(error);
        Swal.fire('Thất bại!', `Không thể dừng bán sản phẩm ${id}.`, 'error');
      }
    }
  };

  const handleContinueProductVariant = async (id) => {
    const result = await Swal.fire({
      title: 'Xác nhận bán',
      text: 'Bạn có chắc muốn bán lại sản phẩm này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      try {
        await api.put(`/product-variant/${id}/continue`); // Giả sử đây là API dừng khuyến mãi
        setIsSelling(true);
        Swal.fire('Thành công!', `Sản phẩm ${id} đã được bán trở lại.`, 'success');
      } catch (error) {
        console.error(error);
        Swal.fire('Thất bại!', `Không thể bán lại sản phẩm ${id}.`, 'error');
      }
    }
  };

  return (
    <div className="mb-6 border border-gray-300 p-6 rounded-sm">
      <div className="flex justify-between items-center mb-4">
        <span className="text-md font-medium">Mục sản phẩm {itemIndex + 1}</span>
        {isSelling ? (
          <button
            type="button"
            onClick={() => {
              handleStopProductVariant(variant?.id);
            }}
            className="text-red-500 hover:text-red-600"
            disabled={isLoading}
          >
            <FaRegStopCircle className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              handleContinueProductVariant(variant?.id);
            }}
            className="text-blue-500 hover:text-blue-600"
            disabled={isLoading}
          >
            <VscDebugContinue className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className={isSelling ? '' : 'pointer-events-none opacity-60'}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hình ảnh chính <span className="text-red-500">*</span>
            </label>
            <div
              className={`border-2 border-dashed rounded-sm p-6 text-center ${
                errors.productItems?.[itemIndex]?.thumb ? 'border-red-600' : 'border-gray-300'
              }`}
            >
              {productItemsPreviews[itemIndex]?.thumb ? (
                <div className="relative">
                  <img
                    src={productItemsPreviews[itemIndex].thumb}
                    alt="Thumbnail"
                    className="mx-auto max-w-full max-h-48 object-contain rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setProductItemsPreviews((prev) => {
                        const newPreviews = [...prev];
                        newPreviews[itemIndex] = { ...newPreviews[itemIndex], thumb: '' };
                        return newPreviews;
                      });
                      setValue(`productItems[${itemIndex}].thumb`, null);
                      setValue(`productItems[${itemIndex}].existingThumb`, '');
                      setError(`productItems[${itemIndex}].thumb`, {
                        message: 'Hình ảnh chính là bắt buộc',
                      });
                      trigger(`productItems[${itemIndex}].thumb`);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <label htmlFor={`item-thumb-${itemIndex}`} className="cursor-pointer">
                    <span className="bg-blue-500 text-white px-4 py-2 rounded-sm hover:bg-blue-600 inline-block">
                      Chọn ảnh
                    </span>
                    <input
                      id={`item-thumb-${itemIndex}`}
                      type="file"
                      accept="image/png,image/jpeg,image/gif"
                      onChange={(e) => handleProductItemThumbChange(itemIndex, e)}
                      className="hidden"
                      disabled={isLoading}
                    />
                  </label>
                  <div className="text-gray-400 text-sm mt-2">PNG, JPG, GIF tối đa 10MB</div>
                </div>
              )}
            </div>
            {errors.productItems?.[itemIndex]?.thumb && (
              <p className="text-red-500 text-sm mt-1">
                {errors.productItems[itemIndex].thumb.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hình ảnh bổ sung <span className="text-red-500">*</span>
            </label>
            <div
              className={`border-2 border-dashed rounded-sm p-6 text-center ${
                errors.productItems?.[itemIndex]?.images ? 'border-red-600' : 'border-gray-300'
              }`}
            >
              <div>
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <label htmlFor={`item-images-${itemIndex}`} className="cursor-pointer">
                  <span className="bg-blue-500 text-white px-4 py-2 rounded-sm hover:bg-blue-600 inline-block">
                    Chọn nhiều ảnh
                  </span>
                  <input
                    id={`item-images-${itemIndex}`}
                    type="file"
                    accept="image/png,image/jpeg,image/gif"
                    multiple
                    onChange={(e) => handleProductItemImageChange(itemIndex, e)}
                    className="hidden"
                    disabled={isLoading}
                  />
                </label>
                <div className="text-gray-400 text-sm mt-2">PNG, JPG, GIF tối đa 10MB mỗi ảnh</div>
              </div>
              {productItemsPreviews[itemIndex]?.images?.some((img) => img) && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {productItemsPreviews[itemIndex].images.map(
                    (img, imageIndex) =>
                      img && (
                        <div key={imageIndex} className="relative">
                          <img
                            src={img}
                            alt={`Image ${imageIndex}`}
                            className="mx-auto max-w-full max-h-48 object-contain rounded"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setProductItemsPreviews((prev) => {
                                const newPreviews = [...prev];
                                newPreviews[itemIndex].images = newPreviews[
                                  itemIndex
                                ].images.filter((_, i) => i !== imageIndex);
                                return newPreviews;
                              });
                              const newImages = control._formValues.productItems[
                                itemIndex
                              ].images.filter((_, i) => i !== imageIndex);
                              setValue(`productItems[${itemIndex}].images`, newImages);
                              if (newImages.length === 0) {
                                setError(`productItems[${itemIndex}].images`, {
                                  message: 'Ít nhất một hình ảnh bổ sung là bắt buộc',
                                });
                              }
                              trigger(`productItems[${itemIndex}].images`);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            disabled={isLoading}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ),
                  )}
                </div>
              )}
            </div>
            {errors.productItems?.[itemIndex]?.images && (
              <p className="text-red-500 text-sm mt-1">
                {errors.productItems[itemIndex].images.message}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Thuộc tính <span className="text-red-500">*</span>
            </label>
            {itemIndex === 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="ml-2 bg-blue-500 text-white rounded-sm p-1 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsUpdateValueModalOpen(true)}
                  className="ml-2 bg-green-500 text-white rounded-sm p-1 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          {attributes.map((attr, attrIndex) => (
            <div key={attr.id} className="mb-4 border border-gray-300 p-4 rounded-sm">
              <div className="flex justify-between items-center mb-2">
                <span>Thuộc tính {attrIndex + 1}</span>
                {itemIndex === 0 && attributes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAttributeFromAllItems(attrIndex)}
                    className="text-red-500 hover:text-red-600"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-2">
                <div className="w-full sm:w-1/2">
                  <Controller
                    control={control}
                    name={`productItems[${itemIndex}].attributes[${attrIndex}].code`}
                    rules={{ required: 'Mã thuộc tính là bắt buộc' }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={availableAttributeOptions}
                        placeholder="Chọn Mistakes mã thuộc tính"
                        isDisabled={isLoading || itemIndex !== 0}
                        onChange={(selected) => {
                          if (itemIndex === 0) {
                            field.onChange(selected ? selected.value : '');
                            setValue(
                              `productItems[${itemIndex}].attributes[${attrIndex}].value`,
                              '',
                            );
                            if (selected) {
                              clearErrors(
                                `productItems[${itemIndex}].attributes[${attrIndex}].code`,
                              );
                              clearErrors(
                                `productItems[${itemIndex}].attributes[${attrIndex}].value`,
                              );
                              productItemsFields.forEach((_, i) => {
                                if (i !== 0) {
                                  setValue(
                                    `productItems[${i}].attributes[${attrIndex}].code`,
                                    selected ? selected.value : '',
                                  );
                                  setValue(`productItems[${i}].attributes[${attrIndex}].value`, '');
                                }
                              });
                              trigger(`productItems[${itemIndex}]`);
                              clearErrors('productItems');
                            }
                          }
                        }}
                        value={
                          attributeOptions.find((option) => option.value === field.value) || null
                        }
                      />
                    )}
                  />
                  {errors.productItems?.[itemIndex]?.attributes?.[attrIndex]?.code && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.productItems[itemIndex].attributes[attrIndex].code.message}
                    </p>
                  )}
                </div>
                <div className="w-full sm:w-1/2">
                  <Controller
                    control={control}
                    name={`productItems[${itemIndex}].attributes[${attrIndex}].value`}
                    rules={{
                      required: 'Giá trị thuộc tính là bắt buộc',
                    }}
                    render={({ field }) => {
                      const selectedCode =
                        control._formValues.productItems[itemIndex]?.attributes[attrIndex]?.code ||
                        '';
                      const valueOptions =
                        attributeOptions.find((opt) => opt.value === selectedCode)?.values || [];
                      return (
                        <Select
                          {...field}
                          options={valueOptions}
                          placeholder="Chọn giá trị thuộc tính"
                          isDisabled={isLoading || !selectedCode}
                          onChange={(selected) => {
                            field.onChange(selected ? selected.value : '');
                            if (selected) {
                              clearErrors(
                                `productItems[${itemIndex}].attributes[${attrIndex}].value`,
                              );
                              trigger(`productItems[${itemIndex}]`);
                              clearErrors('productItems');
                            }
                          }}
                          value={
                            valueOptions.find((option) => option.value === field.value) || null
                          }
                        />
                      );
                    }}
                  />
                  {errors.productItems?.[itemIndex]?.attributes?.[attrIndex]?.value && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.productItems[itemIndex].attributes[attrIndex].value.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {itemIndex === 0 && (
            <button
              type="button"
              onClick={() => appendAttributeToAllItems({ code: '', value: '' })}
              className="text-blue-500 hover:text-blue-600 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || availableAttributeOptions.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" /> Thêm thuộc tính
            </button>
          )}
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giá chính <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            {...register(`productItems[${itemIndex}].price`, {
              required: 'Giá chính là bắt buộc',
              min: { value: 0, message: 'Giá chính không được âm' },
            })}
            placeholder="Nhập giá chính"
            className={`w-full px-3 py-2 border rounded-sm ${
              errors.productItems?.[itemIndex]?.price ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
            onChange={(e) => {
              register(`productItems[${itemIndex}].price`).onChange(e);
              if (!hasInitialPromotion && promotions.length > 0) {
                promotions.forEach((_, promoIndex) => {
                  const discountPercent = parseFloat(
                    control._formValues.productItems[itemIndex]?.promotions[promoIndex]
                      ?.discountPercent || 0,
                  );
                  if (discountPercent > 0) {
                    const discountPrice = Math.round(
                      parseFloat(e.target.value || 0) * (1 - discountPercent / 100),
                    );
                    if (discountPrice >= 1) {
                      setValue(
                        `productItems[${itemIndex}].promotions[${promoIndex}].discountPrice`,
                        discountPrice.toString(),
                      );
                      clearErrors(
                        `productItems[${itemIndex}].promotions[${promoIndex}].discountPrice`,
                      );
                    }
                  }
                });
                trigger(`productItems[${itemIndex}].promotions`);
              }
              trigger(`productItems[${itemIndex}].price`);
            }}
          />
          {errors.productItems?.[itemIndex]?.price && (
            <p className="text-red-500 text-sm mt-1">
              {errors.productItems[itemIndex].price.message}
            </p>
          )}
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tồn kho <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            {...register(`productItems[${itemIndex}].stock`, {
              required: 'Tồn kho là bắt buộc',
              min: { value: 0, message: 'Tồn kho không được âm' },
            })}
            placeholder="Nhập số lượng tồn kho"
            className={`w-full px-3 py-2 border rounded-sm ${
              errors.productItems?.[itemIndex]?.stock ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
            onChange={(e) => {
              register(`productItems[${itemIndex}].stock`).onChange(e);
              trigger(`productItems[${itemIndex}].stock`);
            }}
          />
          {errors.productItems?.[itemIndex]?.stock && (
            <p className="text-red-500 text-sm mt-1">
              {errors.productItems[itemIndex].stock.message}
            </p>
          )}
        </div>

        <div className="mt-6">
          <div className="flex items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Khuyến mãi {localPromotionVisible && '(Chỉ xem)'}
            </label>
            {!localPromotionVisible && (
              <button
                type="button"
                onClick={() =>
                  appendPromotion({
                    startDate: '',
                    endDate: '',
                    discountPercent: '',
                    discountPrice: '',
                  })
                }
                className="ml-2 bg-blue-500 text-white rounded-sm p-1 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || promotions.length >= 1}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          {localPromotionVisible ? (
            <div className="mb-4 border p-4 rounded-sm">
              <div className="flex justify-between items-center mb-2">
                <span>Khuyến mãi hiện tại</span>
                <button
                  type="button"
                  onClick={() => handleStopPromotion(variant?.id)}
                  className="text-red-500 hover:text-red-600"
                  disabled={isLoading}
                >
                  Dừng khuyến mãi
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian bắt đầu
                  </label>
                  <input
                    type="datetime-local"
                    value={variant?.start_day || ''}
                    className="w-full px-3 py-2 border rounded-sm border-gray-300 bg-gray-100"
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian kết thúc
                  </label>
                  <input
                    type="datetime-local"
                    value={variant?.end_day || ''}
                    className="w-full px-3 py-2 border rounded-sm border-gray-300 bg-gray-100"
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phần trăm giảm giá (%)
                  </label>
                  <input
                    type="number"
                    value={variant?.percent || ''}
                    className="w-full px-3 py-2 border rounded-sm border-gray-300 bg-gray-100"
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá sau giảm
                  </label>
                  <input
                    type="number"
                    value={
                      variant?.percent
                        ? Math.round(variant.price * (1 - variant.percent / 100))
                        : ''
                    }
                    className="w-full px-3 py-2 border rounded-sm border-gray-300 bg-gray-100"
                    readOnly
                    disabled
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Giá sau giảm:{' '}
                    {(variant?.percent
                      ? Math.round(variant.price * (1 - variant.percent / 100))
                      : 0
                    ).toLocaleString('vi-VN')}{' '}
                    VNĐ
                  </p>
                </div>
              </div>
            </div>
          ) : (
            promotions.map((promo, promoIndex) => (
              <div key={promo.id} className="mb-4 border p-4 rounded-sm">
                <div className="flex justify-between items-center mb-2">
                  <span>Khuyến mãi</span>
                  <button
                    type="button"
                    onClick={() => removePromotion(promoIndex)}
                    className="text-red-500 hover:text-red-600"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời gian bắt đầu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      {...register(
                        `productItems[${itemIndex}].promotions[${promoIndex}].startDate`,
                        {
                          required: 'Thời gian bắt đầu là bắt buộc',
                          validate: (value) => {
                            const now = new Date();
                            const start = new Date(value);
                            return (
                              start >= now ||
                              'Thời gian bắt đầu phải lớn hơn hoặc bằng thời điểm hiện tại'
                            );
                          },
                        },
                      )}
                      className={`w-full px-3 py-2 border rounded-sm ${
                        errors.productItems?.[itemIndex]?.promotions?.[promoIndex]?.startDate
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                      onChange={(e) => {
                        register(
                          `productItems[${itemIndex}].promotions[${promoIndex}].startDate`,
                        ).onChange(e);
                        trigger(`productItems[${itemIndex}].promotions[${promoIndex}].startDate`);
                      }}
                    />
                    {errors.productItems?.[itemIndex]?.promotions?.[promoIndex]?.startDate && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.productItems[itemIndex].promotions[promoIndex].startDate.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời gian kết thúc <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      {...register(`productItems[${itemIndex}].promotions[${promoIndex}].endDate`, {
                        required: 'Thời gian kết thúc là bắt buộc',
                        validate: (value) => {
                          const startDate =
                            control._formValues.productItems[itemIndex]?.promotions[promoIndex]
                              ?.startDate;
                          if (startDate && value && new Date(value) <= new Date(startDate)) {
                            return 'Thời gian kết thúc phải sau thời gian bắt đầu';
                          }
                          return true;
                        },
                      })}
                      className={`w-full px-3 py-2 border rounded-sm ${
                        errors.productItems?.[itemIndex]?.promotions?.[promoIndex]?.endDate
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                      onChange={(e) => {
                        register(
                          `productItems[${itemIndex}].promotions[${promoIndex}].endDate`,
                        ).onChange(e);
                        trigger(`productItems[${itemIndex}].promotions[${promoIndex}].endDate`);
                      }}
                    />
                    {errors.productItems?.[itemIndex]?.promotions?.[promoIndex]?.endDate && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.productItems[itemIndex].promotions[promoIndex].endDate.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phần trăm giảm giá (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register(
                        `productItems[${itemIndex}].promotions[${promoIndex}].discountPercent`,
                        {
                          required: 'Phần trăm giảm giá là bắt buộc',
                          min: { value: 0, message: 'Phần trăm giảm giá không được âm' },
                          max: { value: 100, message: 'Phần trăm giảm giá không vượt quá 100%' },
                        },
                      )}
                      placeholder="Nhập phần trăm giảm giá"
                      className={`w-full px-3 py-2 border rounded-sm ${
                        errors.productItems?.[itemIndex]?.promotions?.[promoIndex]?.discountPercent
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                      onChange={(e) => {
                        register(
                          `productItems[${itemIndex}].promotions[${promoIndex}].discountPercent`,
                        ).onChange(e);
                        handleDiscountChange(promoIndex, 'discountPercent', e.target.value);
                        trigger(
                          `productItems[${itemIndex}].promotions[${promoIndex}].discountPercent`,
                        );
                      }}
                    />
                    {errors.productItems?.[itemIndex]?.promotions?.[promoIndex]
                      ?.discountPercent && (
                      <p className="text-red-500 text-sm mt-1">
                        {
                          errors.productItems[itemIndex].promotions[promoIndex].discountPercent
                            .message
                        }
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá sau giảm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register(
                        `productItems[${itemIndex}].promotions[${promoIndex}].discountPrice`,
                        {
                          required: 'Giá sau giảm là bắt buộc',
                          min: { value: 1, message: 'Giá sau giảm phải lớn hơn hoặc bằng 1' },
                          validate: {
                            lessThanPrice: (value) => {
                              const price =
                                parseFloat(control._formValues.productItems[itemIndex]?.price) || 0;
                              return value < price || 'Giá sau giảm phải nhỏ hơn giá chính';
                            },
                          },
                        },
                      )}
                      placeholder="Nhập giá sau giảm"
                      className={`w-full px-3 py-2 border rounded-sm ${
                        errors.productItems?.[itemIndex]?.promotions?.[promoIndex]?.discountPrice
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                      onChange={(e) => {
                        register(
                          `productItems[${itemIndex}].promotions[${promoIndex}].discountPrice`,
                        ).onChange(e);
                        handleDiscountChange(promoIndex, 'discountPrice', e.target.value);
                        trigger(
                          `productItems[${itemIndex}].promotions[${promoIndex}].discountPrice`,
                        );
                      }}
                    />
                    {errors.productItems?.[itemIndex]?.promotions?.[promoIndex]?.discountPrice && (
                      <p className="text-red-500 text-sm mt-1">
                        {
                          errors.productItems[itemIndex].promotions[promoIndex].discountPrice
                            .message
                        }
                      </p>
                    )}
                    {control._formValues.productItems[itemIndex]?.promotions[promoIndex]
                      ?.discountPrice && (
                      <p className="text-sm text-gray-600 mt-1">
                        Giá sau giảm:{' '}
                        {parseFloat(
                          control._formValues.productItems[itemIndex].promotions[promoIndex]
                            .discountPrice,
                        ).toLocaleString('vi-VN')}{' '}
                        VNĐ
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Component chính
const UpdateProduct = () => {
  const {
    register,
    formState: { errors },
    reset,
    setError,
    clearErrors,
    setValue,
    control,
    handleSubmit,
    getValues,
    trigger,
  } = useForm({
    mode: 'onChange',
    shouldUnregister: false,
    defaultValues: {
      product: {
        name: '',
        description: '',
        ingredient: '',
        instruction: '',
        image: null,
        existingImage: '',
        category_id: '',
        brand_id: '',
      },
      productItems: [
        {
          price: '',
          thumb: null,
          existingThumb: '',
          images: [],
          stock: '',
          attributes: [{ code: '', value: '' }],
          promotions: [],
        },
      ],
    },
  });

  const {
    fields: productItemsFields,
    append: appendProductItem,
    remove: removeProductItem,
  } = useFieldArray({ control, name: 'productItems' });

  const [productItemsPreviews, setProductItemsPreviews] = useState([{ thumb: '', images: [] }]);
  const [productImagePreview, setProductImagePreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [attributeOptions, setAttributeOptions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateValueModalOpen, setIsUpdateValueModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [variantResponse, setVariantResponse] = useState(null);

  const memoizedReset = useCallback(reset, [reset]);
  const { productId } = useParams();

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      const [productResponse, variantResponse] = await Promise.all([
        api.get(`/product/${productId}`),
        api.get(`/product-variant/${productId}/admin`),
      ]);

      const product = productResponse.data.result;
      setVariantResponse(variantResponse.data.result);

      memoizedReset({
        product: {
          name: product.name || '',
          description: product.description || '',
          ingredient: product.ingredient || '',
          instruction: product.instruction || '',
          image: null,
          existingImage: product.image || '',
          category_id: categories.find((cat) => cat.label === product.category)?.value || '',
          brand_id: brands.find((brand) => brand.label === product.brand)?.value || '',
        },
        productItems: variantResponse.data.result?.map((variant) => ({
          id: variant.id || '',
          price: variant.price?.toString() || '',
          thumb: null,
          existingThumb: variant.image || '',
          images:
            variant.images
              ?.split(',')
              .map((img) => img.trim())
              .filter(Boolean) || [],
          stock: variant.stock?.toString() || '',
          attributes: variant.attribute_values?.map((attr) => ({
            code: attributeOptions.find((opt) => opt.label === attr.attribute_id)?.value || '',
            value:
              attributeOptions
                .find((opt) => opt.label === attr.attribute_id)
                ?.values.find((val) => val.label === attr.id)?.value || '',
          })) || [{ code: '', value: '' }],
          promotions: [],
        })) || [
          {
            price: '',
            thumb: null,
            existingThumb: '',
            images: [],
            stock: '',
            attributes: [{ code: '', value: '' }],
            promotions: [],
          },
        ],
      });

      setProductImagePreview(product.image ? getImageUrl(product.image) : '');
      setProductItemsPreviews(
        variantResponse.data.result?.map((variant) => ({
          thumb: variant.image ? getImageUrl(variant.image) : '',
          images:
            variant.images
              ?.split(',')
              .map((img) => getImageUrl(img.trim()))
              .filter(Boolean) || [],
        })) || [{ thumb: '', images: [] }],
      );
    } catch (error) {
      console.error('Error fetching product:', error);
      setErrorMessage('Lỗi khi tải dữ liệu sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (productId && categories.length > 0 && brands.length > 0 && attributeOptions.length > 0) {
      fetchProduct();
    }
  }, [productId, categories, brands, attributeOptions, memoizedReset]);

  useEffect(() => {
    register('product.image', {
      validate: () =>
        getValues('product.image') || getValues('product.existingImage')
          ? true
          : 'Hình ảnh sản phẩm là bắt buộc',
    });
  }, [register, getValues]);

  useEffect(() => {
    productItemsFields.forEach((_, index) => {
      register(`productItems[${index}].thumb`, {
        validate: () =>
          getValues(`productItems[${index}].thumb`) ||
          getValues(`productItems[${index}].existingThumb`)
            ? true
            : 'Hình ảnh chính là bắt buộc',
      });
      register(`productItems[${index}].images`, {
        validate: (value) =>
          (Array.isArray(value) && value.length > 0) ||
          getValues(`productItems[${index}].images`)?.length > 0
            ? true
            : 'Ít nhất một hình ảnh bổ sung là bắt buộc',
      });
    });
  }, [productItemsFields, register, getValues]);

  const fetchBrands = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/brand');
      setBrands(
        response.data.result.map((brand) => ({
          value: brand.id,
          label: brand.name,
        })),
      );
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Lỗi lấy danh sách thương hiệu');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/category');
      setCategories(
        response.data.result.map((category) => ({
          value: category.id,
          label: category.name,
        })),
      );
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Lỗi lấy danh sách danh mục');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttributes = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/attribute');
      const attributes = response.data.result || [];
      if (!Array.isArray(attributes)) {
        throw new Error('Dữ liệu thuộc tính không hợp lệ');
      }
      const formattedAttributes = attributes.map((attr) => ({
        value: attr.id,
        label: attr.name,
        values: (attr.values || []).map((val) => ({
          value: val.id,
          label: val.name,
        })),
      }));
      setAttributeOptions(formattedAttributes);
    } catch (error) {
      console.error('Error fetching attributes:', error);
      setErrorMessage(error.message || 'Lỗi lấy danh sách thuộc tính');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchBrands(), fetchCategories(), fetchAttributes()]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const appendAttributeToAllItems = (attribute) => {
    productItemsFields.forEach((_, index) => {
      const currentAttributes = getValues(`productItems[${index}].attributes`) || [];
      setValue(`productItems[${index}].attributes`, [...currentAttributes, attribute]);
      trigger(`productItems[${index}]`);
    });
  };

  const removeAttributeFromAllItems = (attrIndex) => {
    productItemsFields.forEach((_, index) => {
      const currentAttributes = getValues(`productItems[${index}].attributes`) || [];
      setValue(
        `productItems[${index}].attributes`,
        currentAttributes.filter((_, i) => i !== attrIndex),
      );
      trigger(`productItems[${index}]`);
    });
  };

  const validateProductItemsAttributes = () => {
    const productItems = getValues('productItems');
    if (productItems.length < 2) return true;

    clearErrors('productItems');
    const firstItemAttributes = productItems[0]?.attributes || [];
    const firstItemCodes = firstItemAttributes.map((attr) => attr.code).filter(Boolean);

    for (let i = 0; i < productItems.length; i++) {
      const currentItemAttributes = productItems[i]?.attributes || [];
      const currentItemCodes = currentItemAttributes.map((attr) => attr.code).filter(Boolean);

      if (
        firstItemCodes.length !== currentItemCodes.length ||
        !firstItemCodes.every((code, idx) => code === currentItemCodes[idx])
      ) {
        setError('productItems', {
          type: 'manual',
          message: 'Tất cả mục sản phẩm phải có danh sách thuộc tính giống nhau',
        });
        return false;
      }
    }

    const attributeValueSets = productItems.map((item, index) => ({
      index,
      values: (item.attributes || []).map((attr) => attr.value || '').join('|'),
    }));

    const seenValues = new Map();
    let hasDuplicate = false;

    for (const { index, values } of attributeValueSets) {
      if (seenValues.has(values)) {
        const duplicateIndex = seenValues.get(values);
        setError(`productItems[${index}].attributes`, {
          type: 'manual',
          message: `Tổ hợp giá trị thuộc tính trùng với mục sản phẩm ${duplicateIndex + 1}`,
        });
        setError(`productItems[${duplicateIndex}].attributes`, {
          type: 'manual',
          message: `Tổ hợp giá trị thuộc tính trùng với mục sản phẩm ${index + 1}`,
        });
        hasDuplicate = true;
      } else {
        seenValues.set(values, index);
      }
    }

    if (hasDuplicate) {
      setError('productItems', {
        type: 'manual',
        message: 'Mỗi mục sản phẩm phải có tổ hợp giá trị thuộc tính duy nhất',
      });
      return false;
    }

    clearErrors('productItems');
    productItems.forEach((_, index) => {
      clearErrors(`productItems[${index}].attributes`);
    });

    return true;
  };

  const handleProductImageChange = (e) => {
    clearErrors('product.image');
    const file = e.target.files[0];
    if (!file) {
      if (!getValues('product.existingImage')) {
        setProductImagePreview('');
        setValue('product.image', null);
        setError('product.image', { message: 'Hình ảnh sản phẩm là bắt buộc' });
        trigger('product.image');
      }
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('product.image', { message: 'Chỉ chấp nhận PNG, JPG, GIF' });
      setProductImagePreview(getValues('product.existingImage') || '');
      setValue('product.image', null);
      trigger('product.image');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('product.image', { message: 'Hình ảnh không vượt quá 10MB' });
      setProductImagePreview(getValues('product.existingImage') || '');
      setValue('product.image', null);
      trigger('product.image');
      return;
    }

    setValue('product.image', file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setProductImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
    trigger('product.image');
  };

  const handleProductItemThumbChange = (itemIndex, e) => {
    clearErrors(`productItems[${itemIndex}].thumb`);
    clearErrors('productItems');
    const file = e.target.files[0];
    if (!file) {
      if (!getValues(`productItems[${itemIndex}].existingThumb`)) {
        setProductItemsPreviews((prev) => {
          const newPreviews = [...prev];
          newPreviews[itemIndex] = { ...newPreviews[itemIndex], thumb: '' };
          return newPreviews;
        });
        setValue(`productItems[${itemIndex}].thumb`, null);
        setValue(`productItems[${itemIndex}].existingThumb`, '');
        setError(`productItems[${itemIndex}].thumb`, {
          message: 'Hình ảnh chính là bắt buộc',
        });
        trigger(`productItems[${itemIndex}].thumb`);
      }
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError(`productItems[${itemIndex}].thumb`, { message: 'Chỉ chấp nhận PNG, JPG, GIF' });
      setProductItemsPreviews((prev) => {
        const newPreviews = [...prev];
        newPreviews[itemIndex] = {
          ...newPreviews[itemIndex],
          thumb: getValues(`productItems[${itemIndex}].existingThumb`) || '',
        };
        return newPreviews;
      });
      setValue(`productItems[${itemIndex}].thumb`, null);
      trigger(`productItems[${itemIndex}].thumb`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(`productItems[${itemIndex}].thumb`, { message: 'Hình ảnh không vượt quá 10MB' });
      setProductItemsPreviews((prev) => {
        const newPreviews = [...prev];
        newPreviews[itemIndex] = {
          ...newPreviews[itemIndex],
          thumb: getValues(`productItems[${itemIndex}].existingThumb`) || '',
        };
        return newPreviews;
      });
      setValue(`productItems[${itemIndex}].thumb`, null);
      trigger(`productItems[${itemIndex}].thumb`);
      return;
    }

    setValue(`productItems[${itemIndex}].thumb`, file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setProductItemsPreviews((prev) => {
        const newPreviews = [...prev];
        if (!newPreviews[itemIndex]) {
          newPreviews[itemIndex] = { thumb: '', images: [] };
        }
        newPreviews[itemIndex] = { ...newPreviews[itemIndex], thumb: e.target.result };
        return newPreviews;
      });
    };
    reader.readAsDataURL(file);
    trigger(`productItems[${itemIndex}].thumb`);
  };

  const handleProductItemImageChange = (itemIndex, e) => {
    clearErrors(`productItems[${itemIndex}].images`);
    clearErrors('productItems');
    const files = Array.from(e.target.files);
    const currentImages = getValues(`productItems[${itemIndex}].images`) || [];
    const currentPreviews = productItemsPreviews[itemIndex]?.images || [];

    if (files.length === 0 && currentImages.length === 0) {
      setError(`productItems[${itemIndex}].images`, {
        message: 'Ít nhất một hình ảnh bổ sung là bắt buộc',
      });
      setProductItemsPreviews((prev) => {
        const newPreviews = [...prev];
        newPreviews[itemIndex] = { ...newPreviews[itemIndex], images: [] };
        return newPreviews;
      });
      setValue(`productItems[${itemIndex}].images`, []);
      trigger(`productItems[${itemIndex}].images`);
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/gif'];
    const invalidFiles = files.filter(
      (file) => !validTypes.includes(file.type) || file.size > 10 * 1024 * 1024,
    );
    if (invalidFiles.length > 0) {
      setError(`productItems[${itemIndex}].images`, {
        message: 'Chỉ chấp nhận PNG, JPG, GIF, tối đa 10MB',
      });
      setProductItemsPreviews((prev) => {
        const newPreviews = [...prev];
        newPreviews[itemIndex] = { ...newPreviews[itemIndex], images: currentPreviews };
        return newPreviews;
      });
      setValue(`productItems[${itemIndex}].images`, currentImages);
      trigger(`productItems[${itemIndex}].images`);
      return;
    }

    const updatedImages = [...currentImages, ...files];
    setValue(`productItems[${itemIndex}].images`, updatedImages);

    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          }),
      ),
    ).then((results) => {
      setProductItemsPreviews((prev) => {
        const newPreviews = [...prev];
        if (!newPreviews[itemIndex]) {
          newPreviews[itemIndex] = { thumb: '', images: [] };
        }
        newPreviews[itemIndex] = {
          ...newPreviews[itemIndex],
          images: [...currentPreviews, ...results],
        };
        return newPreviews;
      });
    });
    trigger(`productItems[${itemIndex}].images`);
  };

  const onSubmit = async (data) => {
    console.log('Form data:', data);
    let hasError = false;

    if (data.productItems.length === 0) {
      setError('productItems', { message: 'Phải có ít nhất một mục sản phẩm' });
      hasError = true;
    }

    data.productItems.forEach((item, index) => {
      if (!item.thumb && !item.existingThumb) {
        setError(`productItems[${index}].thumb`, {
          type: 'required',
          message: 'Hình ảnh chính là bắt buộc',
        });
        hasError = true;
      }
      if (!item.images || item.images.length === 0) {
        setError(`productItems[${index}].images`, {
          type: 'required',
          message: 'Ít nhất một hình ảnh bổ sung là bắt buộc',
        });
        hasError = true;
      }
      if (item.promotions && item.promotions.length > 0) {
        item.promotions.forEach((promo, promoIndex) => {
          if (!promo.startDate) {
            setError(`productItems[${index}].promotions[${promoIndex}].startDate`, {
              type: 'required',
              message: 'Thời gian bắt đầu là bắt buộc',
            });
            hasError = true;
          }
          if (!promo.endDate) {
            setError(`productItems[${index}].promotions[${promoIndex}].endDate`, {
              type: 'required',
              message: 'Thời gian kết thúc là bắt buộc',
            });
            hasError = true;
          }
          if (!promo.discountPercent) {
            setError(`productItems[${index}].promotions[${promoIndex}].discountPercent`, {
              type: 'required',
              message: 'Phần trăm giảm giá là bắt buộc',
            });
            hasError = true;
          }
          if (!promo.discountPrice) {
            setError(`productItems[${index}].promotions[${promoIndex}].discountPrice`, {
              type: 'required',
              message: 'Giá sau giảm là bắt buộc',
            });
            hasError = true;
          }
        });
      }
    });

    if (!validateProductItemsAttributes()) {
      hasError = true;
    }

    if (!data.product.name) {
      setError('product.name', { type: 'required', message: 'Tên sản phẩm là bắt buộc' });
      hasError = true;
    }
    if (!data.product.category_id) {
      setError('product.category_id', { type: 'required', message: 'Danh mục là bắt buộc' });
      hasError = true;
    }
    if (!data.product.brand_id) {
      setError('product.brand_id', { type: 'required', message: 'Thương hiệu là bắt buộc' });
      hasError = true;
    }
    if (
      !data.product.description ||
      data.product.description === '<p><br></p>' ||
      data.product.description === ''
    ) {
      setError('product.description', { type: 'required', message: 'Mô tả là bắt buộc' });
      hasError = true;
    }
    if (
      !data.product.ingredient ||
      data.product.ingredient === '<p><br></p>' ||
      data.product.ingredient === ''
    ) {
      setError('product.ingredient', { type: 'required', message: 'Thành phần là bắt buộc' });
      hasError = true;
    }
    if (
      !data.product.instruction ||
      data.product.instruction === '<p><br></p>' ||
      data.product.instruction === ''
    ) {
      setError('product.instruction', { type: 'required', message: 'Hướng dẫn là bắt buộc' });
      hasError = true;
    }
    if (!data.product.image && !data.product.existingImage) {
      setError('product.image', { type: 'required', message: 'Hình ảnh sản phẩm là bắt buộc' });
      hasError = true;
    }

    if (hasError) {
      console.log('Form errors:', errors);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const formData = new FormData();

      formData.append('id', productId);
      formData.append('name', data.product.name);
      formData.append('category_id', data.product.category_id);
      formData.append('brand_id', data.product.brand_id);
      formData.append('description', data.product.description);
      formData.append('ingredient', data.product.ingredient);
      formData.append('instruction', data.product.instruction);

      if (data.product.image instanceof File) {
        formData.append('image', data.product.image);
      } else if (data.product.existingImage) {
        formData.append('existingImage', data.product.existingImage);
      }

      data.productItems.forEach((item, index) => {
        formData.append(`variants[${index}].id`, item.id || '');
        formData.append(`variants[${index}].price`, item.price);
        formData.append(`variants[${index}].stock`, item.stock);

        item.attributes.forEach((attr, attrIndex) => {
          formData.append(`variants[${index}].attributes[${attrIndex}]`, attr.value);
        });

        if (item.promotions?.[0]) {
          const promo = item.promotions[0];
          formData.append(`variants[${index}].discount.percent`, promo.discountPercent);
          formData.append(`variants[${index}].discount.start_day`, promo.startDate);
          formData.append(`variants[${index}].discount.end_day`, promo.endDate);
        }

        if (item.thumb instanceof File) {
          formData.append(`variants[${index}].image`, item.thumb);
        } else if (item.existingThumb) {
          formData.append(`variants[${index}].existingImage`, item.existingThumb);
        }

        if (Array.isArray(item.images)) {
          item.images.forEach((img, imgIndex) => {
            if (img instanceof File) {
              formData.append(`variants[${index}].images`, img);
            } else {
              formData.append(`variants[${index}].existingImages[${imgIndex}]`, img);
            }
          });
        }
      });

      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }

      await api.put(`/product/${productId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      fetchProduct();
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'Cập nhật sản phẩm thành công!',
        confirmButtonText: 'OK',
      });
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Lỗi khi cập nhật sản phẩm');
    } finally {
      setIsLoading(false);
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
          disabled={isLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> QUẢN LÝ SẢN PHẨM
        </button>
      </div>

      <div className="bg-white rounded-sm shadow-md">
        <div className="bg-[var(--color-title)] text-white p-4 rounded-t-sm">
          <h2 className="text-lg font-semibold">CẬP NHẬT SẢN PHẨM</h2>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <h3 className="text-lg font-medium mb-4">Thông tin sản phẩm</h3>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hình ảnh sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-sm p-6 text-center ${
                      errors.product?.image ? 'border-red-600' : 'border-gray-300'
                    }`}
                  >
                    {productImagePreview ? (
                      <div className="relative">
                        <img
                          src={productImagePreview}
                          alt="Product Image"
                          className="mx-auto max-w-full max-h-48 object-contain rounded"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setProductImagePreview('');
                            setValue('product.image', null);
                            setValue('product.existingImage', '');
                            setError('product.image', {
                              message: 'Hình ảnh sản phẩm là bắt buộc',
                            });
                            trigger('product.image');
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          disabled={isLoading}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <label htmlFor="product-image" className="cursor-pointer">
                          <span className="bg-blue-500 text-white px-4 py-2 rounded-sm hover:bg-blue-600 inline-block">
                            Chọn ảnh
                          </span>
                          <input
                            id="product-image"
                            type="file"
                            accept="image/png,image/jpeg,image/gif"
                            onChange={handleProductImageChange}
                            className="hidden"
                            disabled={isLoading}
                          />
                        </label>
                        <div className="text-gray-400 text-sm mt-2">PNG, JPG, GIF tối đa 10MB</div>
                      </div>
                    )}
                  </div>
                  {errors.product?.image && (
                    <p className="text-red-500 text-sm mt-1">{errors.product.image.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('product.name', { required: 'Tên sản phẩm là bắt buộc' })}
                    placeholder="Tên sản phẩm"
                    className={`w-full px-3 py-1 text-sm border rounded-sm ${
                      errors.product?.name ? 'border-red-600' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                    onChange={(e) => {
                      register('product.name').onChange(e);
                      trigger('product.name');
                    }}
                  />
                  {errors.product?.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.product.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thương hiệu <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="product.brand_id"
                    rules={{ required: 'Thương hiệu là bắt buộc' }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={brands}
                        placeholder="Chọn thương hiệu"
                        isDisabled={isLoading}
                        onChange={(selected) => {
                          field.onChange(selected ? selected.value : '');
                          if (selected) clearErrors('product.brand_id');
                          trigger('product.brand_id');
                        }}
                        value={brands.find((option) => option.value === field.value) || null}
                        classNamePrefix="react-select"
                        className={`react-select ${errors.product?.brand_id ? 'border-red-600' : ''}`}
                      />
                    )}
                  />
                  {errors.product?.brand_id && (
                    <p className="text-red-500 text-sm mt-1">{errors.product.brand_id.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Danh mục <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="product.category_id"
                    rules={{ required: 'Danh mục là bắt buộc' }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={categories}
                        placeholder="Chọn danh mục"
                        isDisabled={isLoading}
                        onChange={(selected) => {
                          field.onChange(selected ? selected.value : '');
                          if (selected) clearErrors('product.category_id');
                          trigger('product.category_id');
                        }}
                        value={categories.find((option) => option.value === field.value) || null}
                        classNamePrefix="react-select"
                        className={errors.product?.category_id ? 'border-red-600' : ''}
                      />
                    )}
                  />
                  {errors.product?.category_id && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.product.category_id.message}
                    </p>
                  )}
                </div>

                <div className="mb-10">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="product.description"
                    rules={{
                      required: 'Mô tả là bắt buộc',
                      validate: (value) =>
                        (value && value.trim() && value !== '<p><br></p>' && value !== '') ||
                        'Mô tả không được để trống',
                    }}
                    render={({ field }) => (
                      <ReactQuill
                        value={field.value || ''}
                        onChange={(value) => {
                          field.onChange(value);
                          if (value && value.trim() && value !== '<p><br></p>' && value !== '') {
                            clearErrors('product.description');
                          } else {
                            setError('product.description', {
                              message: 'Mô tả không được trống',
                            });
                          }
                          trigger('product.description');
                        }}
                        modules={quillModules}
                        formats={quillFormats}
                        className={errors.product?.description ? 'border-red-600' : ''}
                        readOnly={isLoading}
                        style={quillEditorStyle}
                      />
                    )}
                  />
                  {errors.product?.description && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.product.description.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="mb-10">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thành phần <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="product.ingredient"
                    rules={{
                      required: 'Thành phần là bắt buộc',
                      validate: (value) =>
                        (value && value.trim() && value !== '<p><br></p>' && value !== '') ||
                        'Thành phần không được để trống',
                    }}
                    render={({ field }) => (
                      <ReactQuill
                        value={field.value || ''}
                        onChange={(value) => {
                          field.onChange(value);
                          if (value && value.trim() && value !== '<p><br></p>' && value !== '') {
                            clearErrors('product.ingredient');
                          } else {
                            setError('product.ingredient', {
                              message: 'Thành phần không được trống',
                            });
                          }
                          trigger('product.ingredient');
                        }}
                        modules={quillModules}
                        formats={quillFormats}
                        className={errors.product?.ingredient ? 'border-red-600' : ''}
                        readOnly={isLoading}
                        style={quillEditorStyle}
                      />
                    )}
                  />
                  {errors.product?.ingredient && (
                    <p className="text-red-500 text-sm mt-1">{errors.product.ingredient.message}</p>
                  )}
                </div>

                <div className="mb-10">
                  <label className="block text-sm font-medium text-gray-700 mb-2 mt-[69px]">
                    Hướng dẫn <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="product.instruction"
                    rules={{
                      required: 'Hướng dẫn là bắt buộc',
                      validate: (value) =>
                        (value && value.trim() && value !== '<p><br></p>' && value !== '') ||
                        'Hướng dẫn không được để trống',
                    }}
                    render={({ field }) => (
                      <ReactQuill
                        value={field.value || ''}
                        onChange={(value) => {
                          field.onChange(value);
                          if (value && value.trim() && value !== '<p><br></p>' && value !== '') {
                            clearErrors('product.instruction');
                          } else {
                            setError('product.instruction', {
                              message: 'Hướng dẫn không được trống',
                            });
                          }
                          trigger('product.instruction');
                        }}
                        modules={quillModules}
                        formats={quillFormats}
                        className={errors.product?.instruction ? 'border-red-600' : ''}
                        readOnly={isLoading}
                        style={quillEditorStyle}
                      />
                    )}
                  />
                  {errors.product?.instruction && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.product.instruction.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <h3 className="text-lg font-medium mt-8 mb-4">
              Mục sản phẩm <span className="text-red-500">*</span>
            </h3>

            {productItemsFields.map((item, itemIndex) => (
              <ProductItem
                key={item.id}
                itemIndex={itemIndex}
                control={control}
                register={register}
                errors={errors}
                isLoading={isLoading}
                removeProductItem={removeProductItem}
                productItemsPreviews={productItemsPreviews}
                setProductItemsPreviews={setProductItemsPreviews}
                handleProductItemThumbChange={handleProductItemThumbChange}
                handleProductItemImageChange={handleProductItemImageChange}
                setValue={setValue}
                setError={setError}
                clearErrors={clearErrors}
                productItemsFields={productItemsFields}
                attributeOptions={attributeOptions}
                setAttributeOptions={setAttributeOptions}
                setIsModalOpen={setIsModalOpen}
                setIsUpdateValueModalOpen={setIsUpdateValueModalOpen}
                appendAttributeToAllItems={appendAttributeToAllItems}
                removeAttributeFromAllItems={removeAttributeFromAllItems}
                fetchProduct={fetchProduct}
                trigger={trigger}
                hasInitialPromotion={!!variantResponse?.[itemIndex]?.percent}
                variant={variantResponse?.[itemIndex]}
              />
            ))}
            <button
              type="button"
              onClick={() => {
                const firstItemAttributes = getValues('productItems[0].attributes') || [];
                appendProductItem({
                  price: '',
                  thumb: null,
                  existingThumb: '',
                  images: [],
                  stock: '',
                  attributes: firstItemAttributes.map((attr) => ({ code: attr.code, value: '' })),
                  promotions: [],
                });
                setProductItemsPreviews((prev) => [...prev, { thumb: '', images: [] }]);
                clearErrors('productItems');
                trigger(`productItems[${productItemsFields.length}]`);
              }}
              className="text-blue-500 hover:text-blue-600 flex items-center mb-6"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4 mr-2" /> Thêm mục sản phẩm
            </button>
            {errors.productItems && (
              <p className="text-red-500 text-sm mb-4">{errors.productItems.message}</p>
            )}

            <AddAttributeModal
              isOpen={isModalOpen}
              onRequestClose={() => setIsModalOpen(false)}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              setErrorMessage={setErrorMessage}
              attributeOptions={attributeOptions}
              fetchAttributes={fetchAttributes}
            />
            <UpdateAttributeValueModal
              isOpen={isUpdateValueModalOpen}
              onRequestClose={() => setIsUpdateValueModalOpen(false)}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              setErrorMessage={setErrorMessage}
              attributeOptions={attributeOptions}
              fetchAttributes={fetchAttributes}
            />

            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-gray-500 text-white rounded-sm hover:bg-gray-600"
                disabled={isLoading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" /> CẬP NHẬT
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

export default UpdateProduct;
