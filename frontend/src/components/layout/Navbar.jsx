import PillNav from './PillNav';
import logo from '@/assets/image.png';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user } = useAuth();

  const NAV_ITEMS = [
    { label: 'How it works', href: '/how-it-works' },
    { label: 'Borrowers', href: '/borrowers' },
    { label: 'Lenders', href: '/lenders' },
    { label: 'Trust & Safety', href: '/trust' },
    { label: 'FAQ', href: '/faq' },
  ];

  // Dynamically add auth options
  if (user) {
    NAV_ITEMS.push({ label: 'Dashboard', href: '/dashboard' });
  } else {
    NAV_ITEMS.push({ label: 'Log In', href: '/login' });
  }

  return (
    <>
      {/* Spacer — reserves header height since PillNav is absolutely
          positioned and won't otherwise push page content down */}
      <div className="h-[72px]" aria-hidden="true" />
 
      <PillNav
        logo={logo}
        logoAlt="MT Pocket"
        items={NAV_ITEMS}
        activeHref="/"
      />
    </>
  );
}
 