// API Key: 2804eba38ea7909337be
// API Secret: e88430c06edf5982642480abe8d4eb7112619530405c823295e1302984cef101
// JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJlNThlNDAxOC0yYWE4LTQwOTEtYWEwYy0xMmM0Y2FmMzc4NjciLCJlbWFpbCI6Inhhc2VtZTQ5OTJAamFtZWFnbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjI4MDRlYmEzOGVhNzkwOTMzN2JlIiwic2NvcGVkS2V5U2VjcmV0IjoiZTg4NDMwYzA2ZWRmNTk4MjY0MjQ4MGFiZThkNGViNzExMjYxOTUzMDQwNWM4MjMyOTVlMTMwMjk4NGNlZjEwMSIsImV4cCI6MTc2MTE0OTUxOX0.SBsPaA4oOoTFlLBsPuvKmhsAgrFtjyi_9HZaIT52FzA

// GATEWAY: https://gateway.pinata.cloud/ipfs/hashvalue

import { exec } from "child_process"; // Import exec for running the Python script
import { ethers } from "ethers";
import * as Constants from "../constant";
import formidable from "formidable";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import path from "path";

export const config = {
  api: {
    bodyParser: false, // disable built-in body parser
  },
};

// Function to ensure localRepo directory exists
const ensureLocalRepoExists = () => {
  const localRepoPath = path.join(process.cwd(), "localRepo");
  if (!fs.existsSync(localRepoPath)) {
    fs.mkdirSync(localRepoPath);
  }
};

// Function to handle file parsing and buffer reading
async function moveFileToBuffer(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ keepExtensions: true });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error(err);
        return reject("Something went wrong during file parsing.");
      }
      const actualFile = files.file;

      // Read the file as a buffer
      const fileBuffer = fs.readFileSync(actualFile.filepath);
      const uniqueFileName = actualFile.originalFilename; // Get the original filename

      resolve({ uniqueFileName, fileBuffer });
    });
  });
}

// Function to encrypt the file using the Python script
const encryptFile = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    // Write the buffer to a temporary file
    const tempFilePath = path.join(process.cwd(), "tempFile.tmp");

    // Write buffer to temp file
    fs.writeFileSync(tempFilePath, fileBuffer);

    // Command to run the Python script
    const command = `"C:\\Users\\kamis\\AppData\\Local\\Programs\\Python\\Python312\\python.exe" "${path.join(
      process.cwd(),
      "scripts",
      "encrypt.py"
    )}" "${tempFilePath}"`;

    exec(command, (error, stdout, stderr) => {
      // Check for errors during execution
      if (error) {
        console.error(`Error executing Python script: ${error.message}`);
        console.error(`stderr: ${stderr}`);
        return reject("Failed to encrypt the file");
      }

      // Extract necessary data from stdout (e.g., encrypted file name)
      const encryptedFileName = stdout.trim();

      // Save the encrypted file locally
      const localEncryptedFilePath = path.join(
        process.cwd(),
        "localRepo",
        encryptedFileName
      );

      // Ensure localRepo directory exists
      ensureLocalRepoExists();

      // Write encrypted data to the local file (mockup, replace with actual data)
      const encryptedData = fs.readFileSync(tempFilePath); // Replace this with your actual encrypted data retrieval logic
      fs.writeFileSync(localEncryptedFilePath, encryptedData);

      // Now store the file on the blockchain
      storeFileOnBlockchain(localEncryptedFilePath)
        .then((blockchainHash) => {
          // Successfully stored on blockchain, remove the local file
          fs.unlinkSync(localEncryptedFilePath);
          resolve(blockchainHash); // Return the hash or identifier from the blockchain
        })
        .catch((err) => {
          console.error("Failed to store the file on the blockchain:", err);
          reject("Failed to store the file on the blockchain");
        });
    });
  });
};

// Function to store data in the blockchain
async function storeDataInBlockchain(uniqueFileName, fileBuffer) {
  const provider = new ethers.providers.JsonRpcProvider(Constants.API_URL);
  const signer = new ethers.Wallet(Constants.PRIVATE_KEY, provider);
  const StorageContract = new ethers.Contract(
    Constants.contractAddress,
    Constants.contractAbi,
    signer
  );

  const isStored = await StorageContract.isFileStored(uniqueFileName);
  console.log("Is file stored:", isStored);

  if (!isStored) {
    // Encrypt the file using the buffer
    const encryptedContent = await encryptFile(fileBuffer);
    console.log(`File encrypted successfully.`);

    // Create FormData and append the encrypted content as a Blob
    const formData = new FormData();
    const encryptedBlob = Buffer.from(encryptedContent, "utf-8");
    formData.append("file", encryptedBlob, {
      filename: `${uniqueFileName}.enc`,
    });

    try {
      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            pinata_api_key: Constants.PINATA_API_KEY,
            pinata_secret_api_key: Constants.PINATA_SECRET_API_KEY,
            ...formData.getHeaders(),
          },
        }
      );

      const ipfsHash = response.data.IpfsHash; // Get the CID after uploading
      console.log("IPFS Hash:", ipfsHash);

      // Store the hash in the smart contract
      const tx = await StorageContract.upload(uniqueFileName, ipfsHash);
      await tx.wait();

      const storedHash = await StorageContract.getIPFSHash(uniqueFileName);
      return {
        message: `IPFS hash is stored in the smart contract: ${storedHash}`,
      };
    } catch (error) {
      console.error("Error uploading to Pinata:", error);
      throw new Error("Failed to upload to Pinata");
    }
  } else {
    console.log("Data is already stored for this file name");
    const IPFShash = await StorageContract.getIPFSHash(uniqueFileName);
    return {
      message: `IPFS hash is already stored in the smart contract: ${IPFShash}`,
    };
  }
}

// Main handler function
async function handler(req, res) {
  try {
    const { uniqueFileName, fileBuffer } = await moveFileToBuffer(req);
    console.log("Files are read into buffer");

    const response = await storeDataInBlockchain(uniqueFileName, fileBuffer);
    console.log("Hash stored in smart contract");

    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export default handler;
