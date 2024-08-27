// app/auth/layout.js
export default function AuthLayout({ children }) {
  return (
    <div className="flex h-screen">
      <div className="w-full bg-orange-500 p-6 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}