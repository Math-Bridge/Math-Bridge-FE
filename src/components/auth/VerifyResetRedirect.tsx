import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const VerifyResetRedirect = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const oobCode = searchParams.get('oobCode');
    if (oobCode) {
      navigate(`/reset-password?oobCode=${oobCode}`, { replace: true });
    } else {
      navigate('/forgot-password', { replace: true });
    }
  }, [navigate, searchParams]);

  return null;
};

export default VerifyResetRedirect;
