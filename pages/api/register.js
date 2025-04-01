import { ethers } from "ethers";
import * as Constants from "../constant";
import fs from "fs";

const KEY_FILE = "secret.key";

function getKey() {
  if (fs.existsSync(KEY_FILE)) {
    const hexKey = fs.readFileSync(KEY_FILE, "utf-8").trim();
    if (/^[0-9a-fA-F]+$/.test(hexKey) && hexKey.length === 64) {
      return hexKey; // ✅ Return the key as a string
    } else {
      console.log("Invalid key in secret.key, generating a new one.");
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const {
    adminPrivateKey,
    userAddress,
    userName,
    password,
    name,
    role,
    department,
  } = req.body;

  if (!adminPrivateKey || !userAddress) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    // Step 1: Encrypt AES key using CP-ABE API
    const keyGenRes = await fetch("http://localhost:5000/userSecretGen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attr: [role, department],
      }),
    });

    const UserSecretKeyRes = await keyGenRes.json();

    const UserSecretKey = JSON.stringify(UserSecretKeyRes)

    console.log("UserSecretKey:", UserSecretKey);

    // Step 2: Store encrypted AES key in blockchain
    const provider = new ethers.JsonRpcProvider(Constants.API_URL);
    const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
    const contract = new ethers.Contract(
      Constants.UsercontractAddress,
      Constants.contractUserABI,
      adminWallet
    );

    const hashedPassword = ethers.keccak256(ethers.toUtf8Bytes(password));

    const tx = await contract.registerUser(
      userAddress,
      userName,
      password,
      name,
      role,
      department,
      "",
      UserSecretKey, // Store encrypted key
      { gasLimit: 3000000 }
    );

    await tx.wait();

    res.status(200).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: "Registration failed!", error: error.message });
  }
}
