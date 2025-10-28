import React, { useState } from 'react';
import { 
  Upload, 
  User, 
  Mail, 
  Award, 
  FileText, 
  DollarSign,
  Clock,
  MapPin,
  Phone,
  CheckCircle,
  AlertCircle,
  Plus,
  X
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface FormData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    bio: string;
  };
  professionalInfo: {
    subjects: string[];
    experience: string;
    education: string[];
    certifications: string[];
    hourlyRate: number;
    availability: string[];
  };
  documents: {
    resume: File | null;
    certificates: File[];
    idDocument: File | null;
  };
}

const TutorRegister: React.FC = () => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: '',
      bio: ''
    },
    professionalInfo: {
      subjects: [],
      experience: '',
      education: [''],
      certifications: [''],
      hourlyRate: 30,
      availability: []
    },
    documents: {
      resume: null,
      certificates: [],
      idDocument: null
    }
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const subjects = [
    'Algebra', 'Geometry', 'Calculus', 'Statistics', 'Trigonometry',
    'Pre-Calculus', 'Linear Algebra', 'Differential Equations',
    'Discrete Mathematics', 'Number Theory'
  ];

  const availabilitySlots = [
    'Monday Morning', 'Monday Afternoon', 'Monday Evening',
    'Tuesday Morning', 'Tuesday Afternoon', 'Tuesday Evening',
    'Wednesday Morning', 'Wednesday Afternoon', 'Wednesday Evening',
    'Thursday Morning', 'Thursday Afternoon', 'Thursday Evening',
    'Friday Morning', 'Friday Afternoon', 'Friday Evening',
    'Saturday Morning', 'Saturday Afternoon', 'Saturday Evening',
    'Sunday Morning', 'Sunday Afternoon', 'Sunday Evening'
  ];

  const updatePersonalInfo = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateProfessionalInfo = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      professionalInfo: { ...prev.professionalInfo, [field]: value }
    }));
  };

  const toggleSubject = (subject: string) => {
    const subjects = formData.professionalInfo.subjects;
    if (subjects.includes(subject)) {
      updateProfessionalInfo('subjects', subjects.filter(s => s !== subject));
    } else {
      updateProfessionalInfo('subjects', [...subjects, subject]);
    }
  };

  const toggleAvailability = (slot: string) => {
    const availability = formData.professionalInfo.availability;
    if (availability.includes(slot)) {
      updateProfessionalInfo('availability', availability.filter(s => s !== slot));
    } else {
      updateProfessionalInfo('availability', [...availability, slot]);
    }
  };

  const addEducation = () => {
    updateProfessionalInfo('education', [...formData.professionalInfo.education, '']);
  };

  const updateEducation = (index: number, value: string) => {
    const education = [...formData.professionalInfo.education];
    education[index] = value;
    updateProfessionalInfo('education', education);
  };

  const removeEducation = (index: number) => {
    const education = formData.professionalInfo.education.filter((_, i) => i !== index);
    updateProfessionalInfo('education', education);
  };

  const addCertification = () => {
    updateProfessionalInfo('certifications', [...formData.professionalInfo.certifications, '']);
  };

  const updateCertification = (index: number, value: string) => {
    const certifications = [...formData.professionalInfo.certifications];
    certifications[index] = value;
    updateProfessionalInfo('certifications', certifications);
  };

  const removeCertification = (index: number) => {
    const certifications = formData.professionalInfo.certifications.filter((_, i) => i !== index);
    updateProfessionalInfo('certifications', certifications);
  };

  const handleFileUpload = (field: keyof FormData['documents'], file: File | null) => {
    setFormData(prev => ({
      ...prev,
      documents: { ...prev.documents, [field]: file }
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.personalInfo.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.personalInfo.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.personalInfo.email.trim()) newErrors.email = 'Email is required';
      if (!formData.personalInfo.phone.trim()) newErrors.phone = 'Phone is required';
      if (!formData.personalInfo.location.trim()) newErrors.location = 'Location is required';
      if (!formData.personalInfo.bio.trim()) newErrors.bio = 'Bio is required';
    } else if (step === 2) {
      if (formData.professionalInfo.subjects.length === 0) newErrors.subjects = 'At least one subject is required';
      if (!formData.professionalInfo.experience.trim()) newErrors.experience = 'Experience is required';
      if (formData.professionalInfo.education.filter(e => e.trim()).length === 0) newErrors.education = 'At least one education entry is required';
      if (formData.professionalInfo.hourlyRate < 10) newErrors.hourlyRate = 'Hourly rate must be at least $10';
      if (formData.professionalInfo.availability.length === 0) newErrors.availability = 'At least one availability slot is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess(true);
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for applying to become a tutor. We'll review your application and get back to you within 2-3 business days.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Become a MathBridge Tutor</h1>
          <p className="text-gray-600">Join our community of expert math tutors and help students succeed</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4 space-x-8">
            <span className={`text-sm ${currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
              Personal Info
            </span>
            <span className={`text-sm ${currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
              Professional
            </span>
            <span className={`text-sm ${currentStep >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
              Documents
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-6">
                <User className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">{t('personalInformation')}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('firstName')} *</label>
                  <input
                    type="text"
                    value={formData.personalInfo.firstName}
                    onChange={(e) => updatePersonalInfo('firstName', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('lastName')} *</label>
                  <input
                    type="text"
                    value={formData.personalInfo.lastName}
                    onChange={(e) => updatePersonalInfo('lastName', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="email"
                      value={formData.personalInfo.email}
                      onChange={(e) => updatePersonalInfo('email', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="tel"
                      value={formData.personalInfo.phone}
                      onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={formData.personalInfo.location}
                    onChange={(e) => updatePersonalInfo('location', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.location ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="City, State/Country"
                  />
                </div>
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio *</label>
                <textarea
                  value={formData.personalInfo.bio}
                  onChange={(e) => updatePersonalInfo('bio', e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.bio ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Tell us about yourself, your teaching philosophy, and what makes you a great tutor..."
                />
                {errors.bio && <p className="text-red-500 text-sm mt-1">{errors.bio}</p>}
                <p className="text-sm text-gray-500 mt-1">{formData.personalInfo.bio.length}/500 characters</p>
              </div>
            </div>
          )}

          {/* Step 2: Professional Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-6">
                <User className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">{t('professionalInformation')}</h2>
              </div>

              {/* Subjects */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Subjects You Can Teach *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {subjects.map((subject) => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => toggleSubject(subject)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        formData.professionalInfo.subjects.includes(subject)
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
                {errors.subjects && <p className="text-red-500 text-sm mt-1">{errors.subjects}</p>}
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience *</label>
                <select
                  value={formData.professionalInfo.experience}
                  onChange={(e) => updateProfessionalInfo('experience', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.experience ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select experience level</option>
                  <option value="1-2 years">1-2 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="6-10 years">6-10 years</option>
                  <option value="10+ years">10+ years</option>
                </select>
                {errors.experience && <p className="text-red-500 text-sm mt-1">{errors.experience}</p>}
              </div>

              {/* Education */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Education *</label>
                <div className="space-y-3">
                  {formData.professionalInfo.education.map((edu, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={edu}
                        onChange={(e) => updateEducation(index, e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="e.g., Bachelor's in Mathematics - University Name"
                      />
                      {formData.professionalInfo.education.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEducation(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addEducation}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Education</span>
                  </button>
                </div>
                {errors.education && <p className="text-red-500 text-sm mt-1">{errors.education}</p>}
              </div>

              {/* Certifications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Certifications (Optional)</label>
                <div className="space-y-3">
                  {formData.professionalInfo.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={cert}
                        onChange={(e) => updateCertification(index, e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="e.g., Certified Math Teacher, Teaching License"
                      />
                      {formData.professionalInfo.certifications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCertification(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addCertification}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Certification</span>
                  </button>
                </div>
              </div>

              {/* Hourly Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate (USD) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={formData.professionalInfo.hourlyRate}
                    onChange={(e) => updateProfessionalInfo('hourlyRate', parseInt(e.target.value) || 0)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.hourlyRate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="30"
                  />
                </div>
                {errors.hourlyRate && <p className="text-red-500 text-sm mt-1">{errors.hourlyRate}</p>}
                <p className="text-sm text-gray-500 mt-1">Recommended range: $25-$75 per hour</p>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Availability *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availabilitySlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleAvailability(slot)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        formData.professionalInfo.availability.includes(slot)
                          ? 'bg-green-100 border-green-500 text-green-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Clock className="h-4 w-4 inline mr-2" />
                      {slot}
                    </button>
                  ))}
                </div>
                {errors.availability && <p className="text-red-500 text-sm mt-1">{errors.availability}</p>}
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">{t('documents')}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Resume */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Resume/CV *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Upload your resume or CV</p>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload('resume', e.target.files?.[0] || null)}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label
                      htmlFor="resume-upload"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                    >
                      Choose File
                    </label>
                    {formData.documents.resume && (
                      <p className="text-sm text-green-600 mt-2">✓ {formData.documents.resume.name}</p>
                    )}
                  </div>
                </div>

                {/* ID Document */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">ID Document *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Upload government-issued ID</p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload('idDocument', e.target.files?.[0] || null)}
                      className="hidden"
                      id="id-upload"
                    />
                    <label
                      htmlFor="id-upload"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                    >
                      Choose File
                    </label>
                    {formData.documents.idDocument && (
                      <p className="text-sm text-green-600 mt-2">✓ {formData.documents.idDocument.name}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Certificates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Certificates (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload teaching certificates, degrees, or other credentials</p>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setFormData(prev => ({
                        ...prev,
                        documents: { ...prev.documents, certificates: files }
                      }));
                    }}
                    className="hidden"
                    id="certificates-upload"
                  />
                  <label
                    htmlFor="certificates-upload"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    Choose Files
                  </label>
                  {formData.documents.certificates.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {formData.documents.certificates.map((file, index) => (
                        <p key={index} className="text-sm text-green-600">✓ {file.name}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-6 w-6 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Application Review Process</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• We'll review your application within 2-3 business days</li>
                      <li>• You may be contacted for a brief interview</li>
                      <li>• Background check will be conducted for approved applicants</li>
                      <li>• You'll receive an email notification about your application status</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-8 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>

            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                {t('nextStep')}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>{t('submitApplication')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorRegister;