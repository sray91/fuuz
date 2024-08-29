import { Inter } from "next/font/google";
import "./globals.css";
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import NavbarWrapper from '@/components/NavbarWrapper';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "fuuz",
  description: "Workout like a boss",
};

export default async function RootLayout({ children }) {
  const supabase = createServerComponentClient({ cookies });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  return (
    <html lang="en">
      <body className={`${inter.className} w-full h-screen overflow-hidden`}>
      <div className="flex flex-col lg:flex-row h-full w-full">
        {/* Use NavbarWrapper Component */}
        <NavbarWrapper user={user} />
        {/* Main Content */}
        <div className="flex-1 bg-orange-500 p-6 overflow-y-auto">
          {children}
        </div>
      </div>
      </body>
    </html>
  );
}