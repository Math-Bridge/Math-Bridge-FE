import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Calculator,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ChevronRight,
  Clock
} from 'lucide-react';

const Footer: React.FC = () => {
  const location = useLocation();
  const isAuthPage = ['/login', '/signup', '/forgot-password'].includes(location.pathname);

  if (isAuthPage) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-footer-brown via-primary-dark to-footer-brown relative overflow-hidden w-full">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, #FF6B35 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }}></div>
      </div>

      {/* Main Footer */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
          {/* Company Info Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-math">
                <Calculator className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-white group-hover:text-primary transition-colors">
                MathBridge
              </span>
            </Link>
            <p className="text-white/80 mb-8 leading-relaxed">
              Transforming mathematics education through personalized tutoring and innovative teaching methods since 2025.
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {[
                { icon: Facebook, name: 'Facebook', href: '#' },
                { icon: Twitter, name: 'Twitter', href: '#' },
                { icon: Instagram, name: 'Instagram', href: '#' },
                { icon: Linkedin, name: 'LinkedIn', href: '#' },
              ].map((social, idx) => {
                const Icon = social.icon;
                return (
                  <a
                    key={idx}
                    href={social.href}
                    className="group w-11 h-11 bg-white/10 hover:bg-primary rounded-xl flex items-center justify-center transition-all duration-300 hover:shadow-math hover:-translate-y-1"
                    title={social.name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links Section */}
          <div>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <ChevronRight className="h-5 w-5 text-primary" />
              Quick Links
            </h3>
            <ul className="space-y-3">
              {[
                { name: 'Home', href: '/home' },
                // { name: 'About Us', href: '/about' },
                { name: 'Packages', href: '/packages' },
                { name: 'Tutors', href: '/tutors' },
                { name: 'Contract', href: '/contracts' },
              ].map((link, idx) => (
                <li key={idx}>
                  <Link
                    to={link.href}
                    className="group flex items-center gap-2 text-white/70 hover:text-primary transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -ml-6 group-hover:ml-0 transition-all" />
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info Section */}
          <div>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <ChevronRight className="h-5 w-5 text-primary" />
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-white/80">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm">+84 555 555 555</div>  
                </div>
              </li>
              <li className="flex items-start gap-3 text-white/80">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm">contact@mathbridge.edu.vn</div>
                </div>
              </li>
              <li className="flex items-start gap-3 text-white/80">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm">
                  Lot E2a-7, Road D1, D1 Street,<br />
                  Long Thanh My, Thu Duc City,<br />
                  Ho Chi Minh City, Vietnam
                </div>
              </li>
              <li className="flex items-start gap-3 text-white/80">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm">
                  <div>MON - FRI: 8 AM - 8 PM</div>
                  <div>SAT - SUN: 9 AM - 5 PM</div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="relative border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-sm text-white/70 text-center md:text-left">
              © {currentYear} <span className="text-primary font-semibold">MathBridge</span>. All Rights Reserved.
            </div>

            {/* Legal Links */}
            <div className="flex items-center gap-6 text-sm">
              <Link to="/privacy" className="text-white/70 hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-white/70 hover:text-primary transition-colors">
                Terms of Service
              </Link>
              {/* <Link to="/support" className="text-white/70 hover:text-primary transition-colors">
                Support
              </Link> */}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;