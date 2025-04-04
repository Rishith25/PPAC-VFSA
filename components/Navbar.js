import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { useRouter } from "next/router";
import * as Constants from "../pages/constant";

export default function NavBar() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchUserDetails() {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        return;
      }

      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const userAddress = await signer.getAddress();

          const contract = new ethers.Contract(
            Constants.UsercontractAddress,
            Constants.contractUserABI,
            signer
          );
          const userData = await contract.getUserDetails(userAddress);

          setUser({
            name: userData.name,
            role: userData.role,
            department: userData.department,
          });

          localStorage.setItem(
            "user",
            JSON.stringify({
              name: userData.name,
              role: userData.role,
              department: userData.department,
            })
          );
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      }
    }

    fetchUserDetails();
  }, []);

  function logout() {
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  }

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <Link href="/">
        <span className="text-lg font-bold cursor-pointer">PPAC-VFSA</span>
      </Link>

      <div className="flex items-center space-x-6">
        {user ? (
          <>
            <Link href="/dashboard">
              <span className="cursor-pointer hover:text-blue-200">
                Dashboard
              </span>
            </Link>
            {user.role === "Admin" && (
              <Link href="/register">
                <span className="cursor-pointer hover:text-blue-200">
                  Register
                </span>
              </Link>
            )}
            <div className="flex items-center space-x-4">
              <span>Welcome, {user.name}</span>
              <button
                onClick={logout}
                className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <div className="flex space-x-4">
            <Link href="/login">
              <span className="cursor-pointer hover:text-blue-200">Login</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
