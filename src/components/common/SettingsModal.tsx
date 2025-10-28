import React from 'react';
import { Settings, Globe, X } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useTranslation } from '../../hooks/useTranslation';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage } = useSettings();
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            {t('settings')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Language Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('language')}
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => setLanguage('en')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  language === 'en'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>{t('english')}</span>
              </button>
              <button
                onClick={() => setLanguage('vi')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  language === 'vi'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>{t('vietnamese')}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;