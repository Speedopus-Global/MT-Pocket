import { useLocation } from 'react-router-dom';
import PillNav from './PillNav';
import logo from '@/assets/image.png';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();

  const NAV_ITEMS = [
    { label: 'How it works', href: '/#how-it-works' },
    { label: 'What We Offer', href: '/#what-we-offer' },
    { label: 'FAQ', href: '/#faq' },
    { label: 'Trust & Safety', href: '/trust' },
    { label: 'Marketplace', href: '/marketplace' },
  ];

  if (user) {
    NAV_ITEMS.push({ label: 'Dashboard', href: '/dashboard' });
  } else {
    NAV_ITEMS.push({ label: 'Log In', href: '/login' });
  }

  return (
    <>
      <div className="h-[72px]" aria-hidden="true" />
      <PillNav
        logo={logo}
        logoAlt="MT Pocket"
        items={NAV_ITEMS}
        activeHref={`${location.pathname}${location.hash}`}
      />
    </>
  );
}