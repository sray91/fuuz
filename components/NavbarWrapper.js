'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function NavbarWrapper({ user }) {
  const pathname = usePathname();

  const showNavbar = !pathname.startsWith('/auth');

  return showNavbar ? <Navbar user={user} /> : null;
}
