import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const UserProfile: React.FC = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(profile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      const res = await apiService.getCurrentUser();
      if (res.success && res.data) {
        setProfile({
          name: res.data.name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          address: res.data.address || '',
        });
        setForm({
          name: res.data.name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          address: res.data.address || '',
        });
      } else {
        setError(res.error || 'Failed to load user info');
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    const res = await apiService.updateCurrentUser(form);
    if (res.success && res.data) {
      setProfile(form);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
    } else {
      setError(res.error || 'Update failed');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8 animate-fade-in">
      <h2 className="text-2xl font-bold mb-4 text-blue-900">User Profile</h2>
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <>
          {error && <div className="mb-4 text-red-600">{error}</div>}
          {success && <div className="mb-4 text-green-600">{success}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-gray-600 mb-1">Full Name</label>
              {isEditing ? (
                <input name="name" value={form.name} onChange={handleChange} className="form-input w-full" />
              ) : (
                <div className="font-medium text-lg">{profile.name}</div>
              )}
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Email</label>
              <div className="text-gray-800">{profile.email}</div>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Phone</label>
              {isEditing ? (
                <input name="phone" value={form.phone} onChange={handleChange} className="form-input w-full" />
              ) : (
                <div className="text-gray-800">{profile.phone}</div>
              )}
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Address</label>
              {isEditing ? (
                <input name="address" value={form.address} onChange={handleChange} className="form-input w-full" />
              ) : (
                <div className="text-gray-800">{profile.address}</div>
              )}
            </div>
          </div>
          <div className="mt-6 flex space-x-3">
            {isEditing ? (
              <>
                <button onClick={handleSave} className="btn-primary">
                  Save
                </button>
                <button onClick={() => { setIsEditing(false); setForm(profile); }} className="btn-secondary">
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="btn-primary">
                Edit
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfile;