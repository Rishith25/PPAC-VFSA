import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-col items-center justify-center flex-grow text-center px-6">
        <h1 className="text-5xl font-extrabold text-indigo-700 animate-fadeIn">
          Welcome to PPAC-VFSA
        </h1>
        <p className="mt-4 text-lg text-gray-700 max-w-2xl animate-fadeIn delay-200">
          A secure and privacy-preserving search system using blockchain and
          CP-ABE encryption.
        </p>
        <div className="mt-6 flex space-x-4">
          <Link
            href="/register"
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transition duration-300"
            passHref
          >
            Register
          </Link>
          <a
            href="/about"
            className="px-6 py-3 border border-indigo-600 text-indigo-600 font-semibold rounded-lg shadow-lg hover:bg-indigo-100 transition duration-300"
          >
            Learn More
          </a>
        </div>
      </div>
    </div>
  );
}
