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
          const userData = await contract.users(userAddress);

          if (userData.isRegistered) {
            setUser({
              name: userData.name,
              role: userData.role,
            });

            localStorage.setItem(
              "user",
              JSON.stringify({ name: userData.name, role: userData.role })
            );
          }
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
        <span className="text-lg font-bold cursor-pointer">My App</span>
      </Link>
      <div>
        {user ? (
          <div className="flex items-center space-x-4">
            <span>Welcome, {user.userName}</span>
            <button onClick={logout} className="bg-red-500 px-3 py-1 rounded">
              Logout
            </button>
          </div>
        ) : (
          <Link href="/login">
            <span className="cursor-pointer">Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
