"use client";

import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-border bg-background">
      <div className="mx-auto max-w-[1600px] px-6 py-16 lg:px-10">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="group inline-block hover-line text-primary pb-1">
              <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                MT POCKET
              </h2>
            </Link>
            <p className="mt-4 max-w-md text-muted-foreground">
              A trusted platform that helps borrowers connect with verified lenders
              through a transparent and secure experience.
            </p>

            <div className="mt-6 flex gap-4">
              <a href="#" className="rounded-full border border-primary/20 p-2 text-primary hover:bg-primary hover:text-primary-foreground hover:scale-110 hover:-translate-y-1 hover:rotate-12 transition-all duration-300" aria-label="LinkedIn">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM0 8.99h5V24H0V8.99zM8.5 8.99h4.79v2.05h.07c.67-1.27 2.31-2.61 4.75-2.61 5.08 0 6.02 3.34 6.02 7.68V24h-5V16.5c0-1.79-.03-4.09-2.49-4.09-2.49 0-2.87 1.94-2.87 3.95V24h-5V8.99z" />
                </svg>
              </a>
              <a href="#" className="rounded-full border border-primary/20 p-2 text-primary hover:bg-primary hover:text-primary-foreground hover:scale-110 hover:-translate-y-1 hover:rotate-12 transition-all duration-300" aria-label="Twitter">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23 3.01a10.9 10.9 0 01-3.14.86A4.48 4.48 0 0022.43.36a9.04 9.04 0 01-2.88 1.1A4.52 4.52 0 0016.11 0c-2.5 0-4.52 2.03-4.52 4.53 0 .35.04.69.11 1.02C7.69 5.38 4.07 3.38 1.64.64a4.48 4.48 0 00-.61 2.28c0 1.57.8 2.95 2.02 3.76A4.48 4.48 0 01.9 6.1v.06c0 2.19 1.56 4.02 3.63 4.44a4.52 4.52 0 01-2.04.08c.57 1.78 2.23 3.08 4.19 3.12A9.06 9.06 0 010 19.54a12.8 12.8 0 006.92 2.03c8.3 0 12.84-6.88 12.84-12.84l-.01-.58A9.22 9.22 0 0023 3.01z" />
                </svg>
              </a>
              <a href="#" className="rounded-full border border-primary/20 p-2 text-primary hover:bg-primary hover:text-primary-foreground hover:scale-110 hover:-translate-y-1 hover:rotate-12 transition-all duration-300" aria-label="GitHub">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0.297C5.371 0.297 0 5.668 0 12.297c0 5.291 3.438 9.773 8.205 11.366.6.111.82-.261.82-.58 0-.287-.011-1.244-.017-2.254-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.73.083-.73 1.205.085 1.84 1.238 1.84 1.238 1.07 1.835 2.809 1.305 3.495.998.108-.775.418-1.305.76-1.605-2.665-.303-5.467-1.333-5.467-5.931 0-1.31.468-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.3 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.289-1.552 3.295-1.23 3.295-1.23.656 1.653.244 2.874.12 3.176.77.84 1.235 1.911 1.235 3.221 0 4.61-2.807 5.625-5.481 5.921.43.372.814 1.102.814 2.222 0 1.605-.015 2.898-.015 3.292 0 .322.217.697.825.579C20.565 22.067 24 17.584 24 12.297 24 5.668 18.627.297 12 .297z" />
                </svg>
              </a>
              <a href="mailto:support@mtpocket.com" className="rounded-full border border-primary/20 p-2 text-primary hover:bg-primary hover:text-primary-foreground hover:scale-110 hover:-translate-y-1 hover:rotate-12 transition-all duration-300" aria-label="Email">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-5">Product</h3>
            <div className="space-y-3 flex flex-col items-start">
              <Link to="/how-it-works" className="group text-muted-foreground hover:text-primary transition-colors duration-200">
                <span className="hover-line text-sm">How it works</span>
              </Link>
              <Link to="/trust-safety" className="group text-muted-foreground hover:text-primary transition-colors duration-200">
                <span className="hover-line text-sm">Trust &amp; Safety</span>
              </Link>
              <Link to="/faq" className="group text-muted-foreground hover:text-primary transition-colors duration-200">
                <span className="hover-line text-sm">FAQ</span>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-5">Company</h3>
            <div className="space-y-3 flex flex-col items-start">
              <Link to="/about" className="group text-muted-foreground hover:text-primary transition-colors duration-200">
                <span className="hover-line text-sm">About</span>
              </Link>
              <Link to="/contact" className="group text-muted-foreground hover:text-primary transition-colors duration-200">
                <span className="hover-line text-sm">Contact</span>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-5">Legal</h3>
            <div className="space-y-3 flex flex-col items-start">
              <Link to="/terms" className="group text-muted-foreground hover:text-primary transition-colors duration-200">
                <span className="hover-line text-sm">Terms &amp; Conditions</span>
              </Link>
              <Link to="/privacy" className="group text-muted-foreground hover:text-primary transition-colors duration-200">
                <span className="hover-line text-sm">Privacy Policy</span>
              </Link>
              <a href="mailto:support@mtpocket.com" className="group text-muted-foreground hover:text-primary transition-colors duration-200">
                <span className="hover-line text-sm">Support Email</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>
            © {year} MT Pocket. MT Pocket is a facilitator platform — not a bank or
            NBFC. We never handle your money or set loan terms.
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-[-4rem] left-1/2 -translate-x-1/2 select-none">
        <h1 className="whitespace-nowrap text-[10rem] md:text-[15rem] font-black leading-none tracking-tight
        text-transparent bg-clip-text
        bg-gradient-to-b from-foreground/10 via-foreground/5 to-transparent">
          MT POCKET
        </h1>
      </div>

      <div className="h-32" />
    </footer>
  );
}