'use client';

import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { X, Plus, Trash2 } from 'lucide-react';
import Select from 'react-select';
import { useForm, useFieldArray } from 'react-hook-form';
import api from '../../service/api';

Modal.setAppElement('#root');

const UpdateAttributeValueModal = ({
  isOpen,
  onRequestClose,
  isLoading,
  setIsLoading,
  setError,
  attributeOptions,
  fetchAttributes,
  errors,
}) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError: setFieldError,
    formState: { errors: formErrors },
  } = useForm({
    defaultValues: {
      values: [{ value: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'values',
  });

  const [selectedAttribute, setSelectedAttribute] = useState(null);

  useEffect(() => {
    // Reset form when switching attributes
    reset({ values: [{ value: '' }] });
  }, [selectedAttribute, reset]);

  const capitalize = (str) => {
    const trimmed = str.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  };

  const onSubmit = async (data) => {
    if (!selectedAttribute) {
      setError('modal', { message: 'Vui lòng chọn thuộc tính' });
      return;
    }

    const valuesToCheck = data.values.map((v) => v.value.trim());
    const existingLabels = selectedAttribute?.values?.map((val) => val.label.trim().toLowerCase());

    const duplicateIndexes = valuesToCheck
      .map((val, idx) => (existingLabels.includes(val.toLowerCase()) ? idx : -1))
      .filter((idx) => idx !== -1);

    // Empty value check
    const emptyIndexes = valuesToCheck
      .map((val, idx) => (val === '' ? idx : -1))
      .filter((idx) => idx !== -1);

    if (emptyIndexes.length > 0) {
      emptyIndexes.forEach((idx) => {
        setFieldError(`values.${idx}.value`, {
          type: 'manual',
          message: 'Giá trị không được để trống',
        });
      });
      return;
    }

    if (duplicateIndexes.length > 0) {
      duplicateIndexes.forEach((idx) => {
        setFieldError(`values.${idx}.value`, {
          type: 'manual',
          message: 'Giá trị đã tồn tại',
        });
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/attribute/value', {
        attribute_id: selectedAttribute.value,
        values: valuesToCheck.map(capitalize),
      });
      await fetchAttributes();
      setSelectedAttribute(null);
      reset();
      onRequestClose();
    } catch (err) {
      setError('modal', {
        message: err.response?.data?.message || 'Lỗi khi thêm giá trị thuộc tính',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '600px',
          padding: '20px',
          borderRadius: '8px',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <div className="bg-white rounded-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Thêm giá trị thuộc tính</h2>
          <button
            onClick={onRequestClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errors?.modal?.message && (
          <p className="text-red-500 text-sm mb-4">{errors.modal.message}</p>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Chọn thuộc tính */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thuộc tính <span className="text-red-500">*</span>
            </label>
            <Select
              options={attributeOptions}
              placeholder="Chọn thuộc tính"
              isDisabled={isLoading}
              onChange={setSelectedAttribute}
              value={selectedAttribute}
              classNamePrefix="react-select"
              className={!selectedAttribute ? 'border-red-500' : ''}
            />
          </div>

          {/* Nhập nhiều giá trị */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giá trị thuộc tính <span className="text-red-500">*</span>
            </label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex space-x-2 mb-2">
                <div className="w-full">
                  <input
                    {...register(`values.${index}.value`)}
                    placeholder={`Giá trị ${index + 1}`}
                    className={`w-full px-3 py-2 border rounded-sm ${
                      formErrors.values?.[index]?.value ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {formErrors.values?.[index]?.value && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.values[index].value.message}
                    </p>
                  )}
                </div>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-600 mt-2"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => append({ value: '' })}
              className="text-blue-500 hover:text-blue-600 flex items-center"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4 mr-2" /> Thêm giá trị
            </button>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onRequestClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-sm hover:bg-gray-600"
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-pink-500 text-white rounded-sm hover:bg-pink-600 flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" /> Thêm
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default UpdateAttributeValueModal;
