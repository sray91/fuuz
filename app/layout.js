import { Inter } from "next/font/google";
import "./globals.css";
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "fuuz",
  description: "Workout like a boss",
};

export default async function RootLayout({ children }) {
  const supabase = createServerComponentClient({ cookies })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <html lang="en">
      <body>
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}