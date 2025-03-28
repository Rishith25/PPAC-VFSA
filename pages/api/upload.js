// pages/api/upload.js
import formidable from "formidable";
import fs from "fs";
import { uploadToIPFS } from "../../utils/ipfs";
import { storeFileMetadata } from "../../utils/contract";

export const config = {
  api: {
    bodyParser: false, // Required for handling file uploads
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "File upload failed" });

    try {
      const { fileName, policy, keywords, userAddress } = fields;
      const file = files.file;

      if (!fileName || !policy || !keywords || !userAddress || !file) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const fileBuffer = fs.readFileSync(file.filepath);
      const ipfsHash = await uploadToIPFS(fileBuffer);

      await storeFileMetadata(
        fileName,
        ipfsHash,
        policy,
        keywords,
        userAddress
      );

      res
        .status(200)
        .json({ message: "File uploaded successfully!", ipfsHash });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
