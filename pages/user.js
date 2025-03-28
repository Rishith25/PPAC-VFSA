import React, { useState, useEffect } from "react";
import registerUsertoBlockchain from "./api/registerUser"; // Blockchain function

function Dashboard() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState(""); // Password for authentication
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [attributes, setAttributes] = useState("");
  const [userKey, setUserKey] = useState(""); // User key for CP-ABE
  const [message, setMessage] = useState("");

  // useEffect(() => {
  //   fetchUsers();
  // }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/getUsers");
      if (!res.ok) throw new Error("Failed to fetch users.");

      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        console.error("Error fetching users:", data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const result = await registerUsertoBlockchain(
        username,
        password,
        name,
        role,
        department,
        attributes,
        userKey
      );
      setMessage(result.message);
      if (result.success) fetchUsers();
    } catch (err) {
      console.error("Error:", err);
      setMessage("Error registering user.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">User Dashboard</h1>

      <form
        onSubmit={handleRegister}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6"
      >
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Username:
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Password:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Name:
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Role:
          </label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Department:
          </label>
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Attributes (for CP-ABE):
          </label>
          <input
            type="text"
            value={attributes}
            onChange={(e) => setAttributes(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            User Key:
          </label>
          <input
            type="text"
            value={userKey}
            onChange={(e) => setUserKey(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Register
        </button>
      </form>

      {message && <p className="text-green-600 text-center">{message}</p>}

      <h2 className="text-2xl font-bold mt-6">Registered Users</h2>
      {users.length > 0 ? (
        <table className="min-w-full bg-white shadow-md rounded mt-4">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="py-3 px-6">#</th>
              <th className="py-3 px-6">Username</th>
              <th className="py-3 px-6">Name</th>
              <th className="py-3 px-6">Role</th>
              <th className="py-3 px-6">Department</th>
              <th className="py-3 px-6">Attributes</th>
              <th className="py-3 px-6">User Key</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}
              >
                <td className="py-3 px-6">{index + 1}</td>
                <td className="py-3 px-6">{user.username}</td>
                <td className="py-3 px-6">{user.name}</td>
                <td className="py-3 px-6">{user.role}</td>
                <td className="py-3 px-6">{user.department}</td>
                <td className="py-3 px-6">{user.attributes}</td>
                <td className="py-3 px-6">{user.userKey || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-600">No users registered yet.</p>
      )}
    </div>
  );
}

export default Dashboard;
