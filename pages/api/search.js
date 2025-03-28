// pages/api/search.js
import { searchFiles } from "../../utils/contract";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ error: "Keyword is required" });
    }

    const searchResults = await searchFiles(keyword);

    res.status(200).json(searchResults);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
