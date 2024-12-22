import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center p-8 text-white">
      <div className="font-bold text-xl hover:underline">
        <Link href="/">cache</Link>
      </div>

      <div className="space-x-8">
        <Link href="/history" className="hover:underline">
          history
        </Link>
        <Link href="/settings" className="hover:underline">
          settings
        </Link>
        <Link href="/profile" className="hover:underline">
          profile
        </Link>
      </div>
    </nav>
  );
}
