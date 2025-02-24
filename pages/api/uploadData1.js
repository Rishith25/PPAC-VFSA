import { W3upClient } from "@web3-storage/w3up-client";
const { ethers } = require("ethers");
import * as Constants from "../constant";
import formidable from "formidable";
import path from "path";
import axios from "axios";
import fs from "fs";
import { exec } from "child_process";
import FormData from "form-data"; // ✅ Import FormData

export const config = {
  api: {
    bodyParser: false, // disable built-in body parser
  },
};

function moveFiletoServer(req) {
  return new Promise((resolve, reject) => {
    const uploadDir = path.join(process.cwd(), "/pages/uploads");

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      filename: (name, ext, part, form) => part.originalFilename, // ✅ Corrected filename handling
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error(err);
        reject("Something went wrong");
        return;
      }
      if (!files.file) {
        reject("File not provided");
        return;
      }

      const uniqueFileName = files.file.newFilename; // Ensures unique naming
      const actualFileName = files.file.originalFilename;

      resolve({ uniqueFileName, actualFileName });
    });
  });
}

async function encryptAndExtractKeywords(filePath) {
  return new Promise((resolve, reject) => {
    // Ensure file path is correctly passed
    const fullFilePath = path.join(process.cwd(), "/pages/uploads", filePath);

    if (!fs.existsSync(fullFilePath)) {
      reject("File does not exist");
      return;
    }

    exec(`python "scripts/encrypt.py" "${fullFilePath}"`, (error, stdout) => {
      if (error) {
        console.error(`Error executing script: ${error.message}`);
        reject("Failed to encrypt and extract keywords");
        return;
      }

      try {
        const output = JSON.parse(stdout); // ✅ Ensure JSON output in Python script
        resolve(output); // Expecting { encrypted_file_name, extracted_keywords }
      } catch (parseError) {
        console.error("Failed to parse script output:", parseError);
        reject("Failed to parse keywords and encrypted file name");
      }
    });
  });
}

async function storeDataInBlockchain(
  encryptedFileName,
  uniqueFileName,
  keywords
) {
  const provider = new ethers.providers.JsonRpcProvider(Constants.API_URL);
  const signer = new ethers.Wallet(Constants.PRIVATE_KEY, provider);
  const StorageContract = new ethers.Contract(
    Constants.FilecontractAddress,
    Constants.contractAbi,
    signer
  );

  const isStored = await StorageContract.isFileStored(uniqueFileName);

  if (!isStored) {
    const uploadPath = path.join(
      process.cwd(),
      "/pages/encrypted",
      encryptedFileName
    );

    // Ensure file exists before uploading
    if (!fs.existsSync(uploadPath)) {
      throw new Error("Encrypted file does not exist");
    }

    // ✅ Corrected FormData handling
    const formData = new FormData();
    formData.append("file", fs.createReadStream(uploadPath));
    formData.append(
      "pinataMetadata",
      JSON.stringify({
        name: path.basename(uploadPath), // Original file name
        uniqueFileName: path.basename(uniqueFileName), // Unique file name
      })
    );

    try {
      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            pinata_api_key: Constants.PINATA_API_KEY,
            pinata_secret_api_key: Constants.PINATA_SECRET_API_KEY,
            ...formData.getHeaders(), // ✅ Ensure headers are properly handled
          },
        }
      );
      const ipfsHash = response.data.IpfsHash;
      console.log("Storing the data in IPFS");

      const tx = await StorageContract.upload(
        uniqueFileName,
        ipfsHash,
        keywords
      );
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

async function handler(req, res) {
  try {
    const { uniqueFileName, actualFileName } = await moveFiletoServer(req);
    console.log("Files are stored in local server");

    const uploadPath = path.join(
      process.cwd(),
      "/pages/uploads",
      actualFileName
    );

    // Ensure file exists before proceeding
    if (!fs.existsSync(uploadPath)) {
      return res.status(400).json({ error: "Uploaded file not found" });
    }

    // Call the Python script for encryption and keyword extraction
    const { encrypted_file_name, extracted_keywords } =
      await encryptAndExtractKeywords(actualFileName);
    console.log("File encrypted and keywords extracted:", extracted_keywords);

    const response = await storeDataInBlockchain(
      encrypted_file_name,
      uniqueFileName,
      extracted_keywords
    );
    console.log("Hash stored in smart contract");

    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export default handler;
