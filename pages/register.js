import { useState } from "react";
import { ethers } from "ethers";
import * as Constants from "./constant";

export default function RegisterUser() {
  const [userSigner, setUserSigner] = useState(null);
  const [userAddress, setUserAddress] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [policyOperator, setPolicyOperator] = useState("AND"); // Default to AND
  const [attributes, setAttributes] = useState("");

  const roles = ["Admin", "User", "Manager", "Supervisor"];
  const departments = ["IT", "HR", "Finance", "Operations"];

  function generatePolicy() {
    if (role && department) {
      setAttributes(`${role} ${policyOperator} ${department}`);
    }
  }

  async function connectUserWallet() {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) {
        alert("No Ethereum accounts found. Please unlock MetaMask.");
        return;
      }

      const userAddress = accounts[0];
      const signer = await provider.getSigner(userAddress);
      setUserSigner(signer);
      setUserAddress(userAddress);
      alert(`User Wallet Connected: ${userAddress}`);
    } else {
      alert("Please install MetaMask");
    }
  }

  async function registerUser() {
    if (!userAddress) {
      alert("User wallet not connected!");
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminPrivateKey: Constants.ADMIN_PRIVATE_KEY,
          userAddress,
          userName,
          password,
          name,
          role,
          department,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("User registered successfully!");
      } else {
        alert("Registration failed: " + data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Registration failed!");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
          User Registration
        </h2>

        {/* Wallet Button */}
        <button
          onClick={connectUserWallet}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 mb-4 rounded-lg transition"
        >
          Connect User Wallet
        </button>

        {/* Registration Form */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="User Name"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            onChange={(e) => setUserName(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="text"
            placeholder="Name"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            onChange={(e) => setName(e.target.value)}
          />

          {/* Role Dropdown */}
          <select
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              generatePolicy();
            }}
          >
            <option value="">Select Role</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Department Dropdown */}
          <select
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              generatePolicy();
            }}
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Register Button */}
        <button
          onClick={registerUser}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 mt-4 rounded-lg transition"
        >
          Register User
        </button>
      </div>
    </div>
  );
}
