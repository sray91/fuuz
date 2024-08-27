import { Inter } from "next/font/google";
import "./globals.css";
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "fuuz",
  description: "Workout like a boss",
};

export default async function RootLayout({ children }) {
  const supabase = createServerComponentClient({ cookies });
  
  // Use getUser to securely retrieve the authenticated user
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    console.error('Error fetching user:', error);
    return (
      <html lang="en">
        <body className={inter.className}>
          <div className="flex items-center justify-center h-screen">
            <p className="text-red-600">Error fetching user data. Please try again later.</p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className={`${inter.className} w-full h-full overflow-hidden`}>
        <div className="flex h-full w-full">
          {/* Use Navbar Component */}
          <Navbar user={user} />
          
          {/* Main Content */}
          <div className="flex-1 bg-orange-500 p-6 overflow-y-auto">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}