import Link from 'next/link'
import SignOut from './Signout'

export default function Navbar() {
  return (
    <nav className="bg-purple-600 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-white font-bold text-xl">Fuuz</Link>
        <div>
          <Link href="/workout" className="text-white mr-4">Workout</Link>
          <Link href="/workout-history" className="text-white mr-4">Workout History</Link>
          <SignOut />
        </div>
      </div>
    </nav>
  )
}