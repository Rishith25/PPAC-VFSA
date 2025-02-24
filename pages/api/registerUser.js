import { ethers } from "ethers";
import * as Constants from "../constant";

async function registerUsertoBlockchain(name, role, department, attributes) {
  console.log("Registering user with the following details:");
  console.log("Name:", name);
  console.log("Role:", role);
  console.log("Department:", department);
  console.log("Attributes:", attributes);

  try {
    // Validate input
    if (
      !name ||
      !role ||
      !department ||
      !attributes ||
      attributes.trim() === ""
    ) {
      throw new Error(
        "All fields must be filled, and attributes cannot be empty."
      );
    }

    // Serialize attributes if they are an array
    if (Array.isArray(attributes)) {
      attributes = JSON.stringify(attributes);
    }

    // Check if MetaMask (or any provider) is available
    if (!window.ethereum) {
      throw new Error(
        "MetaMask is not installed. Please install MetaMask to continue."
      );
    }

    // Request user to connect wallet
    const provider = new ethers.BrowserProvider(window.ethereum);
    await window.ethereum.request({ method: "eth_requestAccounts" });

    // Get the connected signer (current user)
    const signer = await provider.getSigner();

    // Initialize contract
    const contract = new ethers.Contract(
      Constants.UsercontractAddress,
      Constants.contractUserABI,
      signer
    );

    console.log("Calling contract to register user...");

    // Call the registerUser function on the contract
    const tx = await contract.registerUser(name, role, department, attributes);

    // Wait for the transaction to be mined
    await tx.wait();

    console.log("User registered successfully:", tx);
    return { success: true, message: "User registered successfully!" };
  } catch (error) {
    console.error("Error registering user:", error);

    // Handle specific errors for better debugging
    if (error.code === "INSUFFICIENT_FUNDS") {
      return {
        success: false,
        message: "Insufficient funds to complete the transaction.",
      };
    } else if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
      return {
        success: false,
        message: "Unable to estimate gas for the transaction.",
      };
    }

    // General error message
    return { success: false, message: error.message || "Unknown error" };
  }
}

export default registerUsertoBlockchain;
