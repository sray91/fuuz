'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar({ user }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className="bg-white p-4 lg:w-64">
      <div className="flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="">
          <Image src="/fuuz logo.png" alt="logo" width={120} height={120} />
        </Link>

        {/* Hamburger Icon for Mobile */}
        <div className="block lg:hidden">
          <button onClick={toggleMenu} className="text-black focus:outline-none">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop User Info */}
      <div className="hidden lg:flex items-center mb-8">
        <Image
          src={user?.avatar_url || '/avatar-placeholder.png'}
          alt="User Avatar"
          width={50}
          height={50}
          className="rounded-full mr-4"
        />
        <p className="text-xl text-black">Hello, {user?.name || "User"}</p>
      </div>

      {/* Desktop Menu */}
      <div className="hidden lg:flex lg:flex-col lg:space-y-4 mt-8">
        <Link href="/workout" className="bg-purple-600 py-3 px-6 rounded-full hover:bg-purple-700 transition-colors flex items-center">
          <Image src="/icons/workout.png" alt="Workout" width={50} height={50} className="mr-2" />
          <h1 className="text-black font-bold text-xl">Workout</h1>
        </Link>
        <Link href="/workout-history" className="bg-purple-600 py-3 px-6 rounded-full hover:bg-purple-700 transition-colors flex items-center">
          <Image src="/icons/history.png" alt="Workout History" width={50} height={50} className="mr-2" />
          <h1 className="text-black font-bold text-xl">Workout History</h1>
        </Link>
        <Link href="/goals" className="bg-purple-600 py-3 px-6 rounded-full hover:bg-purple-700 transition-colors flex items-center">
          <Image src="/icons/goals.png" alt="Goals" width={50} height={50} className="mr-2" />
          <h1 className="text-black font-bold text-xl">Goals</h1>
        </Link>
        <Link href="/profile" className="bg-purple-600 py-3 px-6 rounded-full hover:bg-purple-700 transition-colors flex items-center">
          <Image src="/icons/settings.png" alt="Settings" width={50} height={50} className="mr-2" />
          <h1 className="text-black font-bold text-xl">Settings</h1>
        </Link>
        <Link href="/logout" className="bg-orange-500 py-3 px-6 rounded-full hover:bg-purple-700 transition-colors flex items-center">
          <h1 className="text-white font-bold text-xl items-center text-center">Sign Out</h1>
        </Link>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="fixed inset-0 bg-orange-500 z-50 flex flex-col items-center justify-center space-y-8">
          {/* Mobile User Info */}
          <div className="flex items-center mb-8">
            <Image
              src={user?.avatar_url || '/avatar-placeholder.png'}
              alt="User Avatar"
              width={50}
              height={50}
              className="rounded-full mr-4"
            />
            <p className="text-xl text-white">Hello, {user?.email || "User"}</p>
          </div>

          <div className="flex flex-col items-center space-y-8 text-white text-2xl">
            <Link href="/workout" onClick={closeMenu} className="hover:text-gray-200">
              Workout
            </Link>
            <Link href="/workout-history" onClick={closeMenu} className="hover:text-gray-200">
              Workout History
            </Link>
            <Link href="/goals" onClick={closeMenu} className="hover:text-gray-200">
              Goals
            </Link>
            <Link href="/profile" onClick={closeMenu} className="hover:text-gray-200">
              Settings
            </Link>
            <Link href="/logout" onClick={closeMenu} className="hover:text-gray-200 text-purple-800">
              Sign Out
            </Link>
          </div>

          <button onClick={toggleMenu} className="absolute top-4 right-4 text-black focus:outline-none">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      )}
    </nav>
  );
}