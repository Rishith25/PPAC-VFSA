import React, { useState } from "react";

function DecryptFileComponent({ encryptedFileName }) {
  const [decryptedFile, setDecryptedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleDecrypt = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/decryptFile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encrypted_file_name: encryptedFileName }),
      });
      if (!res.ok) throw new Error("Decryption failed");
      const data = await res.json();
      setDecryptedFile(data.decrypted_file_name);
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <button
        onClick={handleDecrypt}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none"
        disabled={loading}
      >
        {loading ? "Decrypting..." : "Decrypt & View"}
      </button>
      {decryptedFile && (
        <div className="mt-4">
          <p className="font-semibold">Decrypted File:</p>
          <a
            href={`/pages/decrypted/${decryptedFile}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            View Decrypted File
          </a>
        </div>
      )}
    </div>
  );
}

export default DecryptFileComponent;
