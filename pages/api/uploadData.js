import { W3upClient } from "@web3-storage/w3up-client";
import { ethers } from "ethers";
import formidable from "formidable";
import path from "path";
import axios from "axios";
import fs from "fs";
import { exec } from "child_process";
import FormData from "form-data";
import * as Constants from "../constant";

export const config = { api: { bodyParser: false } };

const UPLOAD_DIR = path.join(process.cwd(), "/pages/uploads");
const ENCRYPT_DIR = path.join(process.cwd(), "/pages/encrypted");
const ENCRYPT_SCRIPT = path.join(process.cwd(), "/scripts/encrypt.py");

/**
 * Ensures the upload directory exists
 */
function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Handles file upload and moves it to the server
 */
async function moveFileToServer(req) {
  return new Promise((resolve, reject) => {
    ensureUploadDir();

    const form = formidable({
      uploadDir: UPLOAD_DIR,
      keepExtensions: true,
      filename: (name, ext, part) => part.originalFilename,
    });

    form.parse(req, (err, fields, files) => {
      if (err) return reject("Error processing file upload");

      const file = Object.values(files)[0];
      if (!file) return reject("No file provided");
      // console.log(file);
      resolve({
        uniqueFileName: file.newFilename,
        actualFileName: file.originalFilename,
        userAddress: fields.userAddress,
      });
    });
  });
}

/**
 * Encrypts the file and extracts keywords using a Python script
 */
async function encryptAndExtractKeywords(filePath) {
  return new Promise((resolve, reject) => {
    exec(
      `python "${ENCRYPT_SCRIPT}" "${filePath}"`,
      (error, stdout, stderr) => {
        if (error) {
          console.log("Python error", stderr);
          return reject("Encryption script failed");
        }
        try {
          resolve(JSON.parse(stdout));
        } catch (parseError) {
          reject("Failed to parse script output");
        }
      }
    );
  });
}

/**
 * Uploads the encrypted file to Pinata IPFS
 */
async function uploadToPinata(filePath, actualFileName) {
  if (!fs.existsSync(filePath)) throw new Error("Encrypted file missing");

  const formData = new FormData();
  formData.append("file", fs.createReadStream(filePath));
  formData.append(
    "pinataMetadata",
    JSON.stringify({ name: path.basename(actualFileName), actualFileName })
  );

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

  return response.data.IpfsHash;
}

/**
 * API Handler
 */
async function handler(req, res) {
  try {
    const { uniqueFileName, actualFileName, userAddress } =
      await moveFileToServer(req);
    console.log("File uploaded successfully");

    const { encrypted_file_name, extracted_keywords } =
      await encryptAndExtractKeywords(uniqueFileName);
    console.log("Encryption and keyword extraction successful");

    const encryptedFilePath = path.join(ENCRYPT_DIR, encrypted_file_name);
    console.log(encryptedFilePath);
    const ipfsHash = await uploadToPinata(encryptedFilePath, actualFileName);
    console.log("File uploaded to IPFS:", ipfsHash);

    // Return metadata to the frontend for blockchain transaction
    return res.status(200).json({
      message: "File uploaded to IPFS",
      ipfsHash,
      keywords: extracted_keywords,
      uniqueFileName: actualFileName,
      encryptedFileName: encrypted_file_name,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.toString() });
  }
}

export default handler;
