import { exec } from "child_process";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { encrypted_file_name } = req.body;
  if (!encrypted_file_name) {
    return res.status(400).json({ error: "Missing encrypted_file_name" });
  }

  const decryptScript = path.join(process.cwd(), "scripts", "decrypt.py");
  const command = `python "${decryptScript}" "${encrypted_file_name}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("Decryption error:", stderr);
      return res.status(500).json({ error: "Decryption failed" });
    }
    try {
      const output = JSON.parse(stdout);
      return res.status(200).json(output);
    } catch (err) {
      console.error("Failed to parse decryption output:", stdout);
      return res
        .status(500)
        .json({ error: "Failed to parse decryption output" });
    }
  });
}
