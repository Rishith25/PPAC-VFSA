import { ethers } from "ethers";
import * as Constants from "../constant";

async function loginUsertoBlockchain(userName, password) {
  console.log("Logging in user:", userName);

  try {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed.");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const signer = await provider.getSigner();

    const contract = new ethers.Contract(
      Constants.UsercontractAddress,
      Constants.contractUserABI,
      signer
    );

    console.log("Calling contract to log in user...");

    const hashedPassword = ethers.keccak256(ethers.toUtf8Bytes(password));

    // Send transaction
    const tx = await contract.loginUser(userName, password);
    await tx.wait();

    const addr = await signer.getAddress();

    console.log("address: /////////////////////////////////")
    console.log(addr);

    // Fetch user key separately
    const userKey = await contract.getUserKey(addr);

    console.log("User logged in successfully:", userKey);
    return { success: true, message: "User logged in successfully!", userKey };
  } catch (error) {
    console.error("Error logging in user:", error);
    return { success: false, message: error.message || "Unknown error" };
  }
}

export default loginUsertoBlockchain;
