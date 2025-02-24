import { ethers, AbiCoder } from "ethers";
import * as Constants from "../constant"; // Ensure this is correctly configured

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }

  try {
    // Initialize provider and contract
    const provider = new ethers.JsonRpcProvider(Constants.API_URL);
    const contract = new ethers.Contract(
      Constants.UsercontractAddress,
      Constants.contractUserABI,
      provider
    );
    // Fetch all registered users from the contract
    const usersEncoded = await contract.getAllUsers();
    const users = usersEncoded.map((user) => ({
      address: user[0],
      name: user[1],
      role: user[2],
      department: user[3],
      attributes: user[4],
      isActive: user[5],
    }));

    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
}
