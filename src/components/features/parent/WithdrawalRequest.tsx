import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, AlertCircle, CheckCircle, Loader2, Building2, CreditCard, User, Search, ChevronDown } from 'lucide-react';
import { requestWithdrawal, getMyWithdrawalRequests, WithdrawalRequestCreateDto } from '../../../services/api';
import { apiService } from '../../../services/api';

interface Bank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  short_name: string;
  transferSupported?: number;
  lookupSupported?: number;
  support?: number;
  isTransfer?: number;
  swift_code?: string | null;
}

interface BanksResponse {
  code: string;
  desc: string;
  data: Bank[];
}

const WithdrawalRequest: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [formData, setFormData] = useState<WithdrawalRequestCreateDto>({
    amount: 0,
    bankName: '',
    bankAccountNumber: '',
    bankHolderName: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof WithdrawalRequestCreateDto, string>>>({});
  const [success, setSuccess] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [filteredBanks, setFilteredBanks] = useState<Bank[]>([]);
  const [bankSearchTerm, setBankSearchTerm] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [loadingBanks, setLoadingBanks] = useState(true);

  // Fetch banks from VietQR API
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        setLoadingBanks(true);
        const response = await fetch('https://api.vietqr.io/v2/banks');
        if (!response.ok) {
          throw new Error('Failed to fetch banks');
        }
        const data: BanksResponse = await response.json();
        if (data.code === '00' && data.data) {
          // Filter only banks that support transfer
          const transferBanks = data.data.filter(bank => bank.transferSupported === 1);
          setBanks(transferBanks);
          setFilteredBanks(transferBanks);
        }
      } catch (error) {
        console.error('Error fetching banks:', error);
        // Fallback: set empty array, user can still type manually
        setBanks([]);
        setFilteredBanks([]);
      } finally {
        setLoadingBanks(false);
      }
    };

    fetchBanks();
  }, []);

  // Filter banks based on search term
  useEffect(() => {
    if (!bankSearchTerm.trim()) {
      setFilteredBanks(banks);
    } else {
      const searchLower = bankSearchTerm.toLowerCase();
      const filtered = banks.filter(bank =>
        bank.name.toLowerCase().includes(searchLower) ||
        bank.shortName.toLowerCase().includes(searchLower) ||
        bank.code.toLowerCase().includes(searchLower)
      );
      setFilteredBanks(filtered);
    }
  }, [bankSearchTerm, banks]);

  // Fetch wallet balance
  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const userId = userStr ? JSON.parse(userStr).id : null;
        if (!userId) return;

        const res = await apiService.getUserWallet(userId);
        if (res.success && res.data) {
          setWalletBalance(res.data.walletBalance ?? res.data.balance ?? 0);
        }
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
      }
    };

    fetchWalletBalance();
  }, []);

  const handleBankSelect = (bank: Bank) => {
    setSelectedBank(bank);
    setFormData({ ...formData, bankName: bank.shortName });
    setBankSearchTerm('');
    setShowBankDropdown(false);
    if (errors.bankName) {
      setErrors({ ...errors, bankName: undefined });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof WithdrawalRequestCreateDto, string>> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (formData.amount > walletBalance) {
      newErrors.amount = `Amount cannot exceed available balance: ${formatCurrency(walletBalance)}`;
    } else if (formData.amount < 10000) {
      newErrors.amount = 'Minimum amount is 10,000 VND';
    }

    if (!formData.bankName || formData.bankName.trim() === '') {
      newErrors.bankName = 'Please enter bank name';
    }

    if (!formData.bankAccountNumber || formData.bankAccountNumber.trim() === '') {
      newErrors.bankAccountNumber = 'Please enter bank account number';
    } else if (!/^\d+$/.test(formData.bankAccountNumber)) {
      newErrors.bankAccountNumber = 'Bank account number must contain only digits';
    }

    if (!formData.bankHolderName || formData.bankHolderName.trim() === '') {
      newErrors.bankHolderName = 'Please enter account holder name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccess(false);
    setErrors({});

    try {
      const result = await requestWithdrawal(formData);
      
      if (result.success) {
        setSuccess(true);
        // Reset form
        setFormData({
          amount: 0,
          bankName: '',
          bankAccountNumber: '',
          bankHolderName: '',
        });
        setSelectedBank(null);
        // Redirect to history after 2 seconds
        setTimeout(() => {
          navigate('/wallet/history');
        }, 2000);
      } else if (result.error === 'INCOMPLETE_RESPONSE') {
        // Handle incomplete chunked encoding - request may have succeeded
        // Verify by checking withdrawal history
        console.log('Response incomplete, verifying request status...');
        
        // Wait a bit for backend to process
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        try {
          const historyResult = await getMyWithdrawalRequests();
          if (historyResult.success && historyResult.data) {
            // Check if a recent request with matching details exists
            const recentRequest = historyResult.data.find((req: any) => {
              const timeDiff = Math.abs(new Date(req.createdDate || req.CreatedDate).getTime() - new Date().getTime());
              const isRecent = timeDiff < 10000; // Within 10 seconds
              const matchesAmount = Math.abs((req.amount || req.Amount) - formData.amount) < 0.01;
              const matchesBank = (req.bankName || req.BankName) === formData.bankName;
              return isRecent && matchesAmount && matchesBank;
            });

            if (recentRequest) {
              // Request was created successfully despite incomplete response
              setSuccess(true);
              setFormData({
                amount: 0,
                bankName: '',
                bankAccountNumber: '',
                bankHolderName: '',
              });
              setSelectedBank(null);
              setTimeout(() => {
                navigate('/wallet/history');
              }, 2000);
            } else {
              // Request might not have been created, show warning
              setErrors({ 
                amount: 'Request status unclear. Please check your withdrawal history to confirm if the request was created.' 
              });
            }
          } else {
            // Couldn't verify, show warning
            setErrors({ 
              amount: 'Unable to verify request status. Please check your withdrawal history to confirm if the request was created.' 
            });
          }
        } catch (verifyError) {
          console.error('Error verifying request:', verifyError);
          setErrors({ 
            amount: 'Request status unclear. Please check your withdrawal history to confirm if the request was created.' 
          });
        }
      } else {
        setErrors({ amount: result.error || 'Failed to create withdrawal request' });
      }
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      
      // Check if it's a network error that might indicate incomplete response
      const errorMessage = error?.message || '';
      if (errorMessage.includes('ERR_INCOMPLETE_CHUNKED_ENCODING') || 
          errorMessage.includes('ERR_HTTP2_PROTOCOL_ERROR') ||
          errorMessage.includes('HTTP2_PROTOCOL_ERROR') ||
          errorMessage.includes('chunked') ||
          errorMessage.includes('incomplete')) {
        // Try to verify request
        await new Promise(resolve => setTimeout(resolve, 1500));
        try {
          const historyResult = await getMyWithdrawalRequests();
          if (historyResult.success && historyResult.data) {
            const recentRequest = historyResult.data.find((req: any) => {
              const timeDiff = Math.abs(new Date(req.createdDate || req.CreatedDate).getTime() - new Date().getTime());
              return timeDiff < 10000 && 
                     Math.abs((req.amount || req.Amount) - formData.amount) < 0.01 &&
                     (req.bankName || req.BankName) === formData.bankName;
            });
            if (recentRequest) {
              setSuccess(true);
              setFormData({
                amount: 0,
                bankName: '',
                bankAccountNumber: '',
                bankHolderName: '',
              });
              setSelectedBank(null);
              setTimeout(() => {
                navigate('/wallet/history');
              }, 2000);
              return;
            }
          }
        } catch {
          // Ignore verification errors
        }
      }
      
      setErrors({ amount: error.message || 'Failed to create withdrawal request' });
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value.replace(/[^\d.]/g, '')) || 0;
    setFormData({ ...formData, amount: numValue });
    if (errors.amount) {
      setErrors({ ...errors, amount: undefined });
    }
  };

  const quickAmounts = [
    { label: '1M', value: 1000000 },
    { label: '2M', value: 2000000 },
    { label: '5M', value: 5000000 },
    { label: 'All', value: walletBalance },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.bank-dropdown-container')) {
        setShowBankDropdown(false);
      }
    };

    if (showBankDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBankDropdown]);

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <Wallet className="w-10 h-10 text-primary" />
            Withdrawal Request
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Withdraw money from your wallet to your bank account</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900">Withdrawal request submitted successfully!</p>
              <p className="text-sm text-green-700">Redirecting to history page...</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Wallet Balance Info */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Available Balance</p>
                      <p className="text-3xl font-bold text-gray-900">{formatCurrency(walletBalance)}</p>
                    </div>
                    <Wallet className="h-12 w-12 text-primary opacity-50" />
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Withdrawal Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.amount > 0 ? formData.amount.toLocaleString('en-US') : ''}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="Enter amount"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${
                        errors.amount ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">VND</span>
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.amount}
                    </p>
                  )}

                  {/* Quick Amount Buttons */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {quickAmounts.map((quick) => (
                      <button
                        key={quick.label}
                        type="button"
                        onClick={() => setFormData({ ...formData, amount: quick.value })}
                        className="px-4 py-2 bg-gray-100 hover:bg-primary hover:text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {quick.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bank Name */}
                <div className="relative bank-dropdown-container">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Building2 className="inline h-4 w-4 mr-1" />
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div
                      onClick={() => setShowBankDropdown(!showBankDropdown)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition cursor-pointer flex items-center justify-between ${
                        errors.bankName ? 'border-red-300' : 'border-gray-300'
                      } ${selectedBank ? 'bg-white' : 'bg-white'}`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {selectedBank && selectedBank.logo && (
                          <img
                            src={selectedBank.logo}
                            alt={selectedBank.shortName}
                            className="w-8 h-8 object-contain flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <span className={selectedBank ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                          {selectedBank ? selectedBank.shortName : 'Select a bank...'}
                        </span>
                      </div>
                      <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showBankDropdown ? 'rotate-180' : ''}`} />
                    </div>

                    {showBankDropdown && (
                      <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-xl shadow-2xl max-h-80 overflow-hidden">
                        <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              type="text"
                              value={bankSearchTerm}
                              onChange={(e) => setBankSearchTerm(e.target.value)}
                              placeholder="Search bank..."
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-64">
                          {loadingBanks ? (
                            <div className="p-8 text-center">
                              <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto mb-2" />
                              <p className="text-sm text-gray-500">Loading banks...</p>
                            </div>
                          ) : filteredBanks.length === 0 ? (
                            <div className="p-8 text-center">
                              <p className="text-sm text-gray-500">No banks found</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowBankDropdown(false);
                                  setFormData({ ...formData, bankName: bankSearchTerm });
                                }}
                                className="mt-2 text-sm text-primary hover:underline"
                              >
                                Use "{bankSearchTerm}" as bank name
                              </button>
                            </div>
                          ) : (
                            filteredBanks.map((bank) => (
                              <button
                                key={bank.id}
                                type="button"
                                onClick={() => handleBankSelect(bank)}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                              >
                                {bank.logo && (
                                  <img
                                    src={bank.logo}
                                    alt={bank.shortName}
                                    className="w-10 h-10 object-contain flex-shrink-0"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900">{bank.shortName}</p>
                                  <p className="text-xs text-gray-500 truncate">{bank.name}</p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.bankName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.bankName}
                    </p>
                  )}
                </div>

                {/* Bank Account Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <CreditCard className="inline h-4 w-4 mr-1" />
                    Bank Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, bankAccountNumber: e.target.value });
                      if (errors.bankAccountNumber) setErrors({ ...errors, bankAccountNumber: undefined });
                    }}
                    placeholder="Enter bank account number"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${
                      errors.bankAccountNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.bankAccountNumber && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.bankAccountNumber}
                    </p>
                  )}
                </div>

                {/* Bank Holder Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-1" />
                    Account Holder Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.bankHolderName}
                    onChange={(e) => {
                      setFormData({ ...formData, bankHolderName: e.target.value });
                      if (errors.bankHolderName) setErrors({ ...errors, bankHolderName: undefined });
                    }}
                    placeholder="Enter account holder name (uppercase, no accents)"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${
                      errors.bankHolderName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.bankHolderName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.bankHolderName}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading || walletBalance <= 0}
                    className="w-full py-4 bg-gradient-to-r from-primary to-primary-dark text-white font-bold text-lg rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Wallet className="h-5 w-5" />
                        Submit Withdrawal Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sticky top-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Important Information</h3>
              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Processing Time</p>
                    <p>Withdrawal requests will be processed within 1-3 business days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Minimum Amount</p>
                    <p>10,000 VND</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Transaction Fee</p>
                    <p>Free</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Note</p>
                    <p>Please double-check your bank account information before submitting the request</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalRequest;

