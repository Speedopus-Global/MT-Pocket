import PillNav from './PillNav';
import logo from '@/assets/image.png';
 
const NAV_ITEMS = [
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Borrowers', href: '/borrowers' },
  { label: 'Lenders', href: '/lenders' },
  { label: 'Trust & Safety', href: '/trust' },
  { label: 'FAQ', href: '/faq' },
];
 
export default function Navbar() {
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
 