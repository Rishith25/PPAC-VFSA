import React, { useState, useEffect } from "react";
import registerUsertoBlockchain from "./api/registerUser"; // Import your blockchain function

function Dashboard() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState(""); // Role field for registration
  const [department, setDepartment] = useState(""); // Department field
  const [attributes, setAttributes] = useState(""); // Attributes field for CP-ABE
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/getUsers");
      if (!res.ok) throw new Error("Failed to fetch users.");

      const data = await res.json();
      if (data.success) {
        setUsers(data.users); // Update state with the fetched users
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
      // Call the blockchain registration function
      const result = await registerUsertoBlockchain(
        name,
        role,
        department,
        attributes
      );
      if (result.success) {
        setMessage(result.message);
        fetchUsers(); // Reload users after registration
      } else {
        setMessage(result.message);
      }
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
              <th className="py-3 px-6">Name</th>
              <th className="py-3 px-6">Role</th>
              <th className="py-3 px-6">Department</th>
              <th className="py-3 px-6">Attributes</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}
              >
                <td className="py-3 px-6">{index + 1}</td>
                <td className="py-3 px-6">{user.name}</td>
                <td className="py-3 px-6">{user.role || "User"}</td>
                <td className="py-3 px-6">{user.department}</td>
                <td className="py-3 px-6">{user.attributes}</td>
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
