import axios from "axios";
import { ethers } from "ethers";
import * as Constants from "../constant";

// Assuming you have your contract ABI and address
const contractABI = Constants.contractAbi;
const FilecontractAddress = Constants.FilecontractAddress;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Fetch the list of files pinned on Pinata for the user
    const response = await axios.get("https://api.pinata.cloud/data/pinList", {
      headers: {
        pinata_api_key: Constants.PINATA_API_KEY,
        pinata_secret_api_key: Constants.PINATA_SECRET_API_KEY,
      },
    });
    // console.log(response.data);
    const pinnedFiles = response.data.rows.map((file) => ({
      ipfsHash: file.ipfs_pin_hash,
      fileName: file.metadata?.name || "Unknown",
      size: file.size,
      datePinned: file.date_pinned,
    }));

    // console.log("Pinned files:", pinnedFiles);

    // Connect to the blockchain (e.g., using ethers.js and the provider)
    const provider = new ethers.JsonRpcProvider(Constants.API_URL); // Replace with your provider URL
    const contract = new ethers.Contract(
      FilecontractAddress,
      contractABI,
      provider
    );

    const fileNames = await contract.getAllFiles();
    console.log("File names from blockchain:", fileNames);
    // Fetch additional blockchain data for each file
    const filesWithBlockchainData = await Promise.all(
      fileNames.map(async (file) => {
        // Fetch blockchain data (e.g., file details) using the fileName
        try {
          const blockchainData = await contract.getFileDetails(file);
          console.log(blockchainData);

          return {
            fileName: file, // File name from blockchain data
            uniqueFileName: blockchainData[0], // File name from blockchain data
            encryptedFileName: blockchainData[1], // Encrypted file name from blockchain data
            ipfsHash: blockchainData[2], // IPFS Hash from blockchain data
            owner: blockchainData[3], // Owner address from blockchain data
            policy: blockchainData[4], // Policy from blockchain data
            keywords: blockchainData[5], // Keywords from blockchain data
          };
        } catch (err) {
          console.error(
            `Error fetching blockchain data for ${file.fileName}:`,
            err
          );
          return {
            ...file,
            ipfsHash: "Error fetching data",
            owner: "Unknown",
            keywords: [],
          };
        }
      })
    );

    return res.status(200).json({ files: filesWithBlockchainData });
  } catch (error) {
    console.error("Error retrieving files from Pinata or blockchain:", error);
    return res.status(500).json({ error: "Failed to retrieve files" });
  }
}
