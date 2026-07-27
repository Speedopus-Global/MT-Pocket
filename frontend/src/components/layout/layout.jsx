
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ThemeToggle from '../ui/ThemeToggle';
 
export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
 
      <main className="flex-1">
        <Outlet />
      </main>
 
      <Footer />
          
      <div className="fixed bottom-4 right-4 z-[1001]">
        <ThemeToggle />
      </div>
    </div>
  );
}
 