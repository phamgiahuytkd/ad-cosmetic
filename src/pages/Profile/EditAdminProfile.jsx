'use client';

import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Upload, Edit, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import Modal from 'react-modal';
import api from '../../service/api';
import { getCroppedImg, getImageUrl } from '../../common/commonFunc';
import Cropper from 'react-easy-crop';
import { useUser } from '../../components/Context/UserContext';

// Bind modal to app element for accessibility
Modal.setAppElement('#root');

const UserImageEditModal = ({ isOpen, onClose, onSave, initialImage }) => {
  const [imageSrc, setImageSrc] = useState(initialImage || null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    setImageSrc(initialImage || null);
  }, [initialImage]);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      if (!imageSrc) {
        Swal.fire({
          title: 'Lỗi',
          text: 'Vui lòng chọn một ảnh để lưu',
          icon: 'error',
          confirmButtonColor: '#ef4444',
        });
        return;
      }
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onSave(croppedImage);
      onClose();
    } catch (err) {
      console.error('Lỗi khi crop ảnh:', err);
      Swal.fire({
        title: 'Lỗi',
        text: 'Không thể crop ảnh. Vui lòng thử lại.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Chỉnh sửa ảnh đại diện</h2>

        <div className="relative w-full h-64 mb-4">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              className="w-full h-full"
            />
          ) : (
            <span className="text-gray-400 flex items-center justify-center h-full">
              Chưa có ảnh được chọn
            </span>
          )}
        </div>

        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          disabled={!imageSrc}
          className="w-full mb-4 accent-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <input
          id="user-image-file-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <label
          htmlFor="user-image-file-input"
          className="block text-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer mb-4"
        >
          {imageSrc ? 'Chọn ảnh khác' : 'Chọn ảnh từ thiết bị'}
        </label>

        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={!imageSrc}
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};

const EditAdminProfile = () => {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      full_name: '',
      phone: '',
      date_of_birth: '',
      avatar: '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    setError: setPasswordError,
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [adminProfile, setAdminProfile] = useState(null);
  const [isImageEditModalOpen, setIsImageEditModalOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const { fetchUser } = useUser();

  // Fetch admin profile
  const fetchAdminProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/info');
      if (response.data.result) {
        const { full_name, email, phone, date_of_birth, avatar } = response.data.result;
        setAdminProfile({ full_name, email, phone, date_of_birth, avatar });
        setValue('full_name', full_name || '');
        setValue('phone', phone || '');
        setValue('date_of_birth', date_of_birth ? date_of_birth.split('T')[0] : '');
        setValue('avatar', avatar || '');
      } else {
        setErrorMessage(response?.data?.message || 'Không thể tải thông tin admin');
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      setErrorMessage(error.response?.data?.message || 'Lỗi kết nối API');
    } finally {
      setLoading(false);
    }
  }, [setValue]);

  // Initialize form validation
  useEffect(() => {
    register('avatar', {
      required: 'Vui lòng chọn ảnh đại diện',
    });
  }, [register]);

  // Load admin profile on mount
  useEffect(() => {
    fetchAdminProfile();
  }, [fetchAdminProfile]);

  // Handle image save from UserImageEditModal
  const handleImageSave = (croppedImage) => {
    setValue('avatar', croppedImage);
    clearErrors('avatar');
    setIsImageEditModalOpen(false); // Đóng modal sau khi lưu
  };

  // Mask email
  const maskEmail = (email) => {
    if (!email) return 'N/A';
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) return email;
    return `${localPart.slice(0, 2)}****@${domain}`;
  };

  // Handle profile form submission
  const onProfileSubmit = async (data) => {
    try {
      setLoading(true);
      setErrorMessage('');

      // Tạo FormData để gửi multipart/form-data
      const formData = new FormData();
      const date = new Date(data.date_of_birth);
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      formData.append('full_name', data.full_name);
      formData.append('phone', data.phone);
      formData.append('date_of_birth', formattedDate || '');

      // Nếu có avatar (base64), chuyển thành File
      if (data.avatar && data.avatar.startsWith('data:image')) {
        const blob = await fetch(data.avatar).then((res) => res.blob());
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        formData.append('avatar', file);
      }

      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      await api.put('/user', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Swal.fire({
        title: 'Thành công',
        text: 'Cập nhật thông tin admin thành công!',
        icon: 'success',
        confirmButtonColor: '#22c55e',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage(error.response?.data?.message || 'Lỗi khi cập nhật thông tin');
      Swal.fire({
        title: 'Lỗi',
        text: error.response?.data?.message || 'Lỗi khi cập nhật thông tin',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setLoading(false);
      await fetchUser();
    }
  };

  // Handle password form submission
  const onPasswordSubmit = async (data) => {
    try {
      setLoading(true);
      setErrorMessage('');

      if (!data.currentPassword) {
        setPasswordError('currentPassword', {
          type: 'manual',
          message: 'Vui lòng nhập mật khẩu hiện tại',
        });
        return;
      }
      if (!data.newPassword) {
        setPasswordError('newPassword', {
          type: 'manual',
          message: 'Vui lòng nhập mật khẩu mới',
        });
        return;
      }
      if (data.newPassword !== data.confirmPassword) {
        setPasswordError('confirmPassword', {
          type: 'manual',
          message: 'Mật khẩu xác nhận không khớp',
        });
        return;
      }

      await api.post('/auth/change-password', {
        password: data.currentPassword,
        new_password: data.newPassword,
      });

      Swal.fire({
        title: 'Thành công',
        text: 'Đổi mật khẩu thành công!',
        icon: 'success',
        confirmButtonColor: '#22c55e',
      });

      resetPassword();
      setIsPasswordModalOpen(false);
    } catch (error) {
      console.error('Error changing password:', error);
      setErrorMessage(error.response?.data?.message || 'Lỗi khi đổi mật khẩu');
      Swal.fire({
        title: 'Lỗi',
        text: error.response?.data?.message || 'Lỗi khi đổi mật khẩu',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setLoading(false);
    }
  };

  // Modal styles for password
  const passwordModalStyles = {
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
      maxWidth: '500px',
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
          QUẢN LÝ ADMIN
        </button>
      </div>

      <div className="bg-white rounded-sm shadow-md">
        <div className="bg-[var(--color-title)] text-white p-4 rounded-t-sm">
          <h2 className="text-lg font-semibold">CHỈNH SỬA THÔNG TIN ADMIN</h2>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit(onProfileSubmit)}>
            <div className="flex flex-col space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ảnh đại diện <span className="text-red-500">*</span>
                </label>
                <div className="relative w-20 h-20">
                  {control._formValues.avatar ? (
                    <img
                      src={
                        control._formValues.avatar.startsWith('data:image')
                          ? control._formValues.avatar
                          : getImageUrl(control._formValues.avatar) || '/placeholder.png'
                      }
                      alt="Avatar"
                      className="w-20 h-20 object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <Upload className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsImageEditModalOpen(true)}
                    className="absolute bottom-0 right-0 p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                    disabled={loading}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                {errors.avatar && (
                  <p className="text-red-500 text-sm mt-1">{errors.avatar.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('full_name', {
                    required: 'Họ tên là bắt buộc',
                  })}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    errors.full_name ? 'border-red-600' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Nhập họ tên"
                  disabled={loading}
                />
                {errors.full_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  {...register('phone', {
                    required: 'Số điện thoại là bắt buộc',
                    pattern: {
                      value: /^\d{10}$/,
                      message: 'Số điện thoại phải có đúng 10 chữ số',
                    },
                  })}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    errors.phone ? 'border-red-600' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Nhập số điện thoại"
                  disabled={loading}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="w-full px-3 py-2 border rounded-sm bg-gray-100 text-gray-600">
                  {maskEmail(adminProfile?.email)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày sinh</label>
                <input
                  type="date"
                  {...register('date_of_birth')}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    errors.date_of_birth ? 'border-red-600' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  disabled={loading}
                />
                {errors.date_of_birth && (
                  <p className="text-red-500 text-sm mt-1">{errors.date_of_birth.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Thay đổi mật khẩu
              </button>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="px-4 py-2 bg-gray-500 text-white rounded-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    'LƯU THAY ĐỔI'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Modal chỉnh sửa ảnh đại diện */}
      <UserImageEditModal
        isOpen={isImageEditModalOpen}
        onClose={() => setIsImageEditModalOpen(false)}
        onSave={handleImageSave}
        initialImage={control._formValues.avatar}
      />

      {/* Modal chỉnh sửa mật khẩu */}
      <Modal
        isOpen={isPasswordModalOpen}
        onRequestClose={() => setIsPasswordModalOpen(false)}
        style={passwordModalStyles}
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Thay đổi mật khẩu</h2>
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                {...registerPassword('currentPassword', {
                  required: 'Mật khẩu hiện tại là bắt buộc',
                })}
                className={`w-full px-3 py-2 border rounded-sm ${
                  passwordErrors.currentPassword ? 'border-red-600' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Nhập mật khẩu hiện tại"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-9 text-gray-500"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              {passwordErrors.currentPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <input
                type={showNewPassword ? 'text' : 'password'}
                {...registerPassword('newPassword', {
                  required: 'Mật khẩu mới là bắt buộc',
                  minLength: {
                    value: 8,
                    message: 'Mật khẩu mới phải có ít nhất 8 ký tự',
                  },
                })}
                className={`w-full px-3 py-2 border rounded-sm ${
                  passwordErrors.newPassword ? 'border-red-600' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Nhập mật khẩu mới"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-9 text-gray-500"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              {passwordErrors.newPassword && (
                <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...registerPassword('confirmPassword', {
                  required: 'Vui lòng xác nhận mật khẩu mới',
                })}
                className={`w-full px-3 py-2 border rounded-sm ${
                  passwordErrors.confirmPassword ? 'border-red-600' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Xác nhận mật khẩu mới"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-gray-500"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              {passwordErrors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {passwordErrors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="text-right">
              <a href="/forgot-password" className="text-sm text-blue-500 hover:underline">
                Quên mật khẩu?
              </a>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                  Đang xử lý...
                </>
              ) : (
                'Lưu mật khẩu'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EditAdminProfile;
