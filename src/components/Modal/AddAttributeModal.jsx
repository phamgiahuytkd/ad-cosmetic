import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import Modal from 'react-modal';
import api from '../../service/api';

const AddAttributeModal = ({
  isOpen,
  onRequestClose,
  isLoading,
  setIsLoading,
  setError,
  attributeOptions,
  fetchAttributes,
}) => {
  const {
    register: modalRegister,
    handleSubmit: modalHandleSubmit,
    formState: { errors: modalErrors },
    control: modalControl,
    reset: modalReset,
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      attributeName: '',
      attributeValues: [{ value: '', label: '' }],
    },
  });

  const {
    fields: attributeValuesFields,
    append: appendAttributeValue,
    remove: removeAttributeValue,
  } = useFieldArray({
    control: modalControl,
    name: 'attributeValues',
  });

  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const handleModalSubmit = async (data) => {
    setIsLoading(true);
    const attributeName = capitalize(data.attributeName);
    const attributeValues = data.attributeValues.map((item) => capitalize(item.value));

    const payload = {
      name: attributeName,
      values: attributeValues,
    };

    try {
      await api.post('/attribute', payload);
      await fetchAttributes(); // Cập nhật lại danh sách thuộc tính
      onRequestClose();
      modalReset();
    } catch (error) {
      setError('form', {
        message:
          error.response?.data?.message ||
          error.message ||
          'Có lỗi xảy ra khi tạo thuộc tính. Vui lòng thử lại.',
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
          marginRight: '-50%',
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
      <h2 className="text-lg font-semibold mb-4">Thêm thuộc tính mới</h2>
      <form onSubmit={modalHandleSubmit(handleModalSubmit)}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tên thuộc tính <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...modalRegister('attributeName', {
              required: 'Tên thuộc tính là bắt buộc',
              validate: (value) =>
                !attributeOptions.some((opt) => opt.label === capitalize(value)) ||
                'Tên thuộc tính đã tồn tại',
            })}
            placeholder="Ví dụ: Phân loại"
            className={`w-full px-3 py-2 border rounded-sm ${modalErrors.attributeName ? 'border-red-500' : 'border-gray-300'}`}
            disabled={isLoading}
          />
          {modalErrors.attributeName && (
            <p className="text-red-500 text-sm mt-1">{modalErrors.attributeName.message}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giá trị thuộc tính <span className="text-red-500">*</span>
          </label>
          {attributeValuesFields.map((field, index) => (
            <div key={field.id} className="flex space-x-2 mb-2">
              <div className="w-full">
                <input
                  {...modalRegister(`attributeValues[${index}].value`, {
                    required: 'Giá trị là bắt buộc',
                  })}
                  placeholder="Giá trị"
                  className={`w-full px-3 py-2 border rounded-sm ${modalErrors.attributeValues?.[index]?.value ? 'border-red-500' : 'border-gray-300'}`}
                  disabled={isLoading}
                />
                {modalErrors.attributeValues?.[index]?.value && (
                  <p className="text-red-500 text-sm mt-1">
                    {modalErrors.attributeValues[index].value.message}
                  </p>
                )}
              </div>
              {attributeValuesFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAttributeValue(index)}
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
            onClick={() => appendAttributeValue({ value: '', label: '' })}
            className="text-blue-500 hover:text-blue-600 flex items-center"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" /> Thêm giá trị
          </button>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              onRequestClose();
              modalReset();
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-sm hover:bg-gray-600"
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-pink-500 text-white rounded-sm hover:bg-pink-600 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" /> Thêm thuộc tính
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddAttributeModal;
