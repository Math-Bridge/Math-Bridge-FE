import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Loader, Upload, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { apiService } from '../../services/api';
import type { Course } from '../../types';

interface PackageFormProps {
  course?: Course | null;
  centerId?: string;
  onSave: (course: Course) => void;
  onCancel: () => void;
}

const PackageForm: React.FC<PackageFormProps> = ({ course, centerId, onSave, onCancel }) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [centers, setCenters] = useState<any[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(course?.image_url || null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    center_id: course?.center_id || centerId || '',
    name: course?.name || '',
    description: course?.description || '',
    category: course?.category || '',
    level: course?.level || 'Beginner',
    duration_weeks: course?.duration_weeks || 0,
    price: course?.price || 0,
    start_date: course?.start_date || '',
    end_date: course?.end_date || '',
    schedule: course?.schedule || '',
    status: course?.status || 'upcoming',
    image_url: course?.image_url || ''
  });

  useEffect(() => {
    if (!centerId) {
      fetchCenters();
    }
  }, [centerId]);

  const fetchCenters = async () => {
    try {
      const response = await fetch('/api/centers');
      if (response.ok) {
        const data = await response.json();
        setCenters(data);
      }
    } catch (error) {
      console.error('Error fetching centers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (course) {
        const updateData = {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          level: formData.level,
          duration_weeks: formData.duration_weeks,
          price: formData.price,
          start_date: formData.start_date,
          end_date: formData.end_date,
          schedule: formData.schedule,
          status: formData.status,
          image_url: formData.image_url,
          center_id: formData.center_id,
        };

        const response = await fetch(`/api/packages/${course.course_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to update package');
        }

        showSuccess('Package updated successfully!');
        onSave(course);
      } else {
        const createData = {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          level: formData.level,
          duration_weeks: formData.duration_weeks,
          price: formData.price,
          start_date: formData.start_date,
          end_date: formData.end_date,
          schedule: formData.schedule,
          status: formData.status,
          image_url: formData.image_url,
          center_id: formData.center_id,
        };

        const response = await fetch('/api/packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createData)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create package');
        }

        const result = await response.json();
        const newPackageId = result.packageId || result.courseId;

        // Upload image if file was selected for new package
        let finalImageUrl = formData.image_url;
        if (selectedImageFile && newPackageId) {
          const uploadedImageUrl = await handleImageUpload(newPackageId, selectedImageFile);
          if (uploadedImageUrl) {
            finalImageUrl = uploadedImageUrl;
          }
          setSelectedImageFile(null);
        }

        showSuccess('Package created successfully!');

        const newCourse: Course = {
          course_id: newPackageId,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          level: formData.level,
          duration_weeks: formData.duration_weeks,
          price: formData.price,
          start_date: formData.start_date,
          end_date: formData.end_date,
          schedule: formData.schedule,
          status: formData.status,
          image_url: finalImageUrl,
          center_id: formData.center_id,
        };

        onSave(newCourse);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save package';
      console.error('Error saving package:', error);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['duration_weeks', 'price'].includes(name)
        ? Number(value)
        : value
    }));
    // Update preview if image_url changes
    if (name === 'image_url') {
      setImagePreview(value || null);
    }
  };

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      showError('Image size must be less than 2MB');
      return;
    }

    // Validate file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      showError('Invalid file type. Only JPG, PNG and WebP are allowed.');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // If editing existing package, upload immediately
    if (course?.course_id) {
      setUploadingImage(true);
      try {
        const response = await apiService.uploadPackageImage(course.course_id, file);
        if (response.success && response.data?.imageUrl) {
          setFormData(prev => ({ ...prev, image_url: response.data.imageUrl }));
          showSuccess('Image uploaded successfully!');
        } else {
          showError(response.error || 'Failed to upload image');
          setImagePreview(course.image_url || null);
        }
      } catch (error) {
        showError('Failed to upload image');
        setImagePreview(course.image_url || null);
      } finally {
        setUploadingImage(false);
      }
    } else {
      // For new packages, save file for later upload after package creation
      setSelectedImageFile(file);
    }
  };

  const handleImageUpload = async (packageId: string, file: File) => {
    setUploadingImage(true);
    try {
      const response = await apiService.uploadPackageImage(packageId, file);
      if (response.success && response.data?.imageUrl) {
        setFormData(prev => ({ ...prev, image_url: response.data.imageUrl }));
        showSuccess('Image uploaded successfully!');
        return response.data.imageUrl;
      } else {
        showError(response.error || 'Failed to upload image');
        return null;
      }
    } catch (error) {
      showError('Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-gradient-to-r from-primary to-primary-light p-6 rounded-t-3xl border-b-2 border-primary z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {course ? 'Edit Package' : 'Create New Package'}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!centerId && (
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Learning Center *
                </label>
                <select
                  name="center_id"
                  value={formData.center_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all outline-none"
                >
                  <option value="">Select a center</option>
                  {centers.map(center => (
                    <option key={center.centerId} value={center.centerId}>{center.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Package Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                placeholder="Enter package name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none"
                placeholder="Enter package description"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category *
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                placeholder="e.g., Math, English"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Level
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Duration (weeks)
              </label>
              <input
                type="number"
                name="duration_weeks"
                value={formData.duration_weeks}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price ($)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              >
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Schedule
              </label>
              <input
                type="text"
                name="schedule"
                value={formData.schedule}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                placeholder="e.g., Mon/Wed/Fri 10:00-12:00"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Package Image
              </label>
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-4 relative">
                  <img
                    src={imagePreview}
                    alt="Package preview"
                    className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData(prev => ({ ...prev, image_url: '' }));
                      setSelectedImageFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* File Upload */}
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageFileSelect}
                  disabled={uploadingImage}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingImage ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-gray-700">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-primary" />
                      <span className="text-gray-700 font-medium">
                        {imagePreview ? 'Change Image' : 'Upload Image'}
                      </span>
                    </>
                  )}
                </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      JPG, PNG, WebP (max 2MB)
                    </p>
                  </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-white font-semibold rounded-xl hover:from-primary-dark hover:to-primary transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{course ? 'Update Package' : 'Create Package'}</span>
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

export default PackageForm;
