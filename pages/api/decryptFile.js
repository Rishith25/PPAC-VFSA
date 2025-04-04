import { exec } from "child_process";
import path from "path";
import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { encrypted_file_name, aes_key, sk_key } = req.body;
  console.log("SK_KEY", sk_key);
  if (!encrypted_file_name && !aes_key) {
    return res
      .status(400)
      .json({ error: "Missing encrypted_file_name and aes_key" });
  }

  const response = await axios.post("http://172.31.80.1:5000/decrypt", {
    sk_key: sk_key,
    aes_key: aes_key,
  });

  const decrypted_key = await response.data["decrypted_key"];

  console.log("Decryption Successful:", decrypted_key);

  const decryptScript = path.join(process.cwd(), "scripts", "decrypt.py");
  const command = `python "${decryptScript}" "${encrypted_file_name}" "${aes_key}"`;

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
