import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface LogoutLinkProps {
  className?: string;
  label?: string;
}

export default function LogoutLink({ className = '', label = 'Log out' }: LogoutLinkProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/assessment');
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={className || 'text-gray-600 hover:text-gray-900 transition text-sm font-medium'}
    >
      {label}
    </button>
  );
}
