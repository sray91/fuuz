import Link from 'next/link';
import Image from 'next/image';
import SignOut from '@/components/Signout';

export default function Navbar({ user }) {
  return (
    <div className="w-1/4 bg-white p-6 flex flex-col">
      <div className="flex items-center mb-8">
        <Link href="/" className="">
          <Image src="/fuuz logo.png" alt="logo" width={200} height={200} />
        </Link>
      </div>
      <div className="flex items-center mb-8">
        <Image
          src={user?.avatar_url || '/avatar-placeholder.png'}
          alt="User Avatar"
          width={50}
          height={50}
          className="rounded-full mr-4"
        />
        <p className="text-xl text-black">Hello, {user?.email || "User"}</p>
      </div>
      <nav className="flex flex-col space-y-4">
          <Link href="/workout" className="bg-purple-600 py-3 px-6 rounded-full hover:bg-purple-700 transition-colors flex items-center">
              <Image src="/icons/workout.png" alt="Workout" width={50} height={50} className="mr-2" />
              <h1 className="text-black font-bold text-xl text-center">Workout</h1>
          </Link>
          <Link href="/workout-history" className="bg-purple-600 py-3 px-6 rounded-full text-center hover:bg-purple-700 transition-colors flex items-center">
            <Image src="/icons/history.png" alt="Workout" width={50} height={50} className="mr-2" />
            <h1 className="text-black font-bold text-xl text-center">Workout history</h1>
          </Link>
          <Link href="/goals" className="bg-purple-600 py-3 px-6 rounded-full text-center hover:bg-purple-700 transition-colors flex items-center">
            <Image src="/icons/goals.png" alt="Workout" width={50} height={50} className="mr-2" />
            <h1 className="text-black font-bold text-xl text-center">Goals</h1>
          </Link>
          <Link href="/settings" className="bg-purple-600 py-3 px-6 rounded-full text-center hover:bg-purple-700 transition-colors flex items-center">
            <Image src="/icons/settings.png" alt="Workout" width={50} height={50} className="mr-2" />
            <h1 className="text-black font-bold text-xl text-center">Settings</h1>
          </Link>
          <SignOut />
      </nav>
    </div>
  );
}