import { Inter } from "next/font/google";
import "./globals.css";
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Navbar from '@/components/Navbar';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "fuuz",
  description: "Workout like a boss",
};

export default async function RootLayout({ children }) {
  const supabase = createServerComponentClient({ cookies });
  
  const {
    data: { session },
  } = await supbase.auth.getSession();

  const user = session?.user;

  // Check if the current path is under the 'auth' directory
  const pathname = usePathname();

  const showNavbar = !pathname.startsWith('/auth');

  return (
    <html lang="en">
      <body className={`${inter.className} w-full h-full overflow-hidden`}>
        <div className="flex h-full w-full">
          {/* Conditionally Render Navbar */}
          {showNavbar && <Navbar user={user} />}
          
          {/* Main Content */}
          <div className="flex-1 bg-orange-500 p-6 overflow-y-auto">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}