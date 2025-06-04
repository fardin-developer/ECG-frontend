'use client';

import React, { useState } from 'react';
import { Activity, FileText, Heart, Menu, X } from 'lucide-react';
import Link from 'next/link';

const ECGApp = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { id: 'monitor', name: 'Live Monitor', icon: Activity, href: '/monitor' },
    { id: 'data', name: 'Data Loader', icon: FileText, href: '/data' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Heart className="text-red-500 mr-3" size={28} />
              <div>
                <span className="text-xl font-bold text-gray-800">ECG Analysis Suite</span>
                <div className="text-xs text-gray-500">Professional ECG Monitoring & Analysis</div>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  >
                    <Icon size={16} className="mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200 bg-white">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-left flex items-center px-3 py-2 text-base font-medium transition-colors duration-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  >
                    <Icon size={16} className="mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export default ECGApp;