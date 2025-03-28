import formidable from "formidable";
import path from "path";
import axios from "axios";
import fs from "fs";
import { exec } from "child_process";
import FormData from "form-data";
import * as Constants from "../constant";
import util from "util";

export const config = { api: { bodyParser: false } };
const execPromise = util.promisify(exec); // ✅ Convert exec() to return a Promise

const UPLOAD_DIR = path.join(process.cwd(), "/pages/uploads");
const ENCRYPT_DIR = path.join(process.cwd(), "/pages/encrypted");
const KEYWORD_SCRIPT = path.join(process.cwd(), "/scripts/extract_keywords.py");
const ENCRYPT_SCRIPT = path.join(process.cwd(), "/scripts/encrypt.py");
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

      resolve({
        uniqueFileName: file.newFilename,
        actualFileName: file.originalFilename,
        userAddress: fields.userAddress,
        filePath: file.filepath,
      });
    });
  });
}

async function encryptAndExtractKeywords(filePath) {
  try {
    // Step 1: Extract keywords and Bloom Filter
    const { stdout } = await execPromise(
      `python "${KEYWORD_SCRIPT}" "${filePath}"`
    ); // ✅ Fix: Use correct path
    let extractedData;
    try {
      extractedData = JSON.parse(stdout);
    } catch (parseError) {
      throw new Error("Failed to parse keyword extraction output");
    }

    const { keywords, bloom_filter } = extractedData;
    console.log("Extracted Keywords:", keywords);
    // console.log("Bloom Filter Data:", bloom_filter);

    const { encrypted_file_name, extracted_keywords } = await new Promise(
      (resolve, reject) => {
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
      }
    );

    // Step 2: Encrypt the file using Flask API
    const response = await axios.post("http://172.31.80.1:5000/encrypt", {
      secret_key: getKey(),
      policy: "(A AND B) OR C",
    });

    console.log("Encryption Successful:", response.data);
    return { ...response.data, keywords, bloom_filter, encrypted_file_name };
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    throw new Error("Encryption or keyword extraction failed");
  }
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
    const { uniqueFileName, actualFileName, userAddress, filePath } =
      await moveFileToServer(req);
    console.log("File uploaded successfully", uniqueFileName);

    const { ciphertext, keywords, bloom_filter, encrypted_file_name } =
      await encryptAndExtractKeywords(filePath); // ✅ Fix: Use correct variable
    console.log("Encryption and keyword extraction successful");

    // const encryptedFilePath = path.join(ENCRYPT_DIR, encrypted_file_name);
    const encryptedFilePath = encrypted_file_name;
    console.log(encryptedFilePath);
    const ipfsHash = await uploadToPinata(encryptedFilePath, actualFileName);
    console.log("File uploaded to IPFS:", ipfsHash);

    // Return metadata to the frontend for blockchain transaction
    return res.status(200).json({
      message: "File uploaded to IPFS",
      ipfsHash,
      keywords, // ✅ Fix: Use correct variable
      uniqueFileName: actualFileName,
      encryptedFileName: encrypted_file_name,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.toString() });
  }
}

export default handler;
