import React, { useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import * as Constants from "./constant";
import Fuse from "fuse.js";

// Your existing storeDataInBlockchain function here...
async function storeDataInBlockchain(
  fileName,
  uniqueFileName,
  encryptedFileName,
  ipfsHash,
  encrypted_key,
  policy,
  keywords,
  key
) {
  if (!window.ethereum) {
    alert("MetaMask is not installed. Please install MetaMask to continue.");
    return;
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();

  const StorageContract = new ethers.Contract(
    Constants.FilecontractAddress,
    Constants.contractAbi,
    signer
  );

  console.log(
    `Uploading file to blockchain as ${await signer.getAddress()}...`
  );

  const tx = await StorageContract.upload(
    fileName,
    uniqueFileName,
    encryptedFileName,
    ipfsHash,
    key,
    encrypted_key,
    policy,
    keywords
  );
  await tx.wait();

  alert(
    `File stored successfully! IPFS Hash: ${await StorageContract.getIPFSHash(
      fileName
    )}`
  );
}

export function DecryptModal({ file, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [decTime, setDecTime] = useState(0);

  const handleDecrypt = async () => {
    setLoading(true);
    try {
      const userKey = JSON.parse(localStorage.getItem("user"));
      const sk_key = userKey.userKey;
      const startTime = performance.now();
      const res = await fetch("/api/decryptFile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encrypted_file_name: file.encryptedFileName,
          aes_key: file.aes_key,
          sk_key: sk_key,
        }),
      });
      if (!res.ok) throw new Error("Decryption failed");
      const data = await res.json();

      const endTime = performance.now();
      setDecTime((endTime - startTime).toFixed(2));

      if (data.error) throw new Error(data.error);

      let b64String = data.decrypted_content.trim();
      // Add padding if necessary
      while (b64String.length % 4 !== 0) {
        b64String += "=";
      }

      // Convert base64 to Blob (for download)
      const byteCharacters = atob(b64String);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      const blob = new Blob(byteArrays, { type: "application/octet-stream" });

      // Trigger download
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = data.original_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Decrypt File</h2>
        {error && <p className="text-red-600">{error}</p>}
        <button
          onClick={handleDecrypt}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Decrypting..." : "Download Decrypted File"}
        </button>
        <p className="text-gray-600 text-sm mb-4">
          Decryption time: {decTime} ms
        </p>
        <button
          onClick={onClose}
          className="ml-2 px-4 py-2 rounded bg-gray-500 text-white"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [encryptedFileName, setEncryptedFileName] = useState("");
  const [policy, setPolicy] = useState("");
  const [keyword, setKeyword] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [error, setError] = useState("");
  const [filesList, setFilesList] = useState([]);
  const [showDecryptModal, setShowDecryptModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [policyOperator, setPolicyOperator] = useState("AND");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTime, setSearchTime] = useState(0);
  const [encTime, setEncTime] = useState(0);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [userDepartment, setUserDepartment] = useState("");
  const [userAddress, setUserAddress] = useState("");

  useEffect(() => {
    const getWalletAddress = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          setUserAddress(await signer.getAddress());
        }
      }
    };
    getWalletAddress();
  }, []);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      setUserRole(userData.role);
      setUserDepartment(userData.department);
    }
  }, []);

  const satisfiesPolicy = (filePolicy) => {
    if (!userRole || !userDepartment) return false;

    // Handle owner files separately
    if (filePolicy.toLowerCase() === "owner") return true;

    const parts = filePolicy.split(" ");
    if (parts.length !== 3) return false;

    const [requiredRole, operator, requiredDept] = parts;
    const roleMatch = userRole === requiredRole;
    const deptMatch = userDepartment === requiredDept;

    return operator === "AND" ? roleMatch && deptMatch : roleMatch || deptMatch;
  };

  const roles = ["Admin", "User", "Manager", "Supervisor"];
  const departments = ["IT", "HR", "Finance", "Operations"];

  const handleAddKeyword = () => {
    if (keyword.trim()) {
      setKeywords([...keywords, keyword.trim()]);
      setKeyword("");
    }
  };

  const handleRemoveKeyword = (index) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("filename", fileName);
      formData.append("file", file);
      formData.append("policy", policy);
      formData.append("keywords", JSON.stringify(keywords));

      const startTime = performance.now();

      const res = await fetch("/api/uploadData", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Network response is not ok");

      const data = await res.json();

      const endTime = performance.now();
      setEncTime(endTime - startTime);

      // Merge manually entered keywords with extracted keywords
      const combinedKeywords = [...new Set([...keywords])];
      console.log("Combined keywords:", combinedKeywords);

      await storeDataInBlockchain(
        fileName,
        data.uniqueFileName,
        data.encryptedFileName,
        data.ipfsHash,
        data.encrypted_key,
        policy,
        combinedKeywords,
        data.key
      );

      // Refresh file list after upload
      fetchFilesList();
    } catch (err) {
      console.error(err);
      setError(err.toString());
    }
  };

  const fetchFilesList = async () => {
    try {
      const res = await fetch("/api/listFiles");
      if (!res.ok) throw new Error("Failed to fetch file list.");

      const data = await res.json();
      setFilesList(data.files || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load file list. Please try again.");
    }
  };

  useEffect(() => {
    fetchFilesList();
  }, []);

  const policyFilteredFiles = useMemo(
    () =>
      filesList.filter(
        (file) =>
          file.owner?.toLowerCase() === userAddress?.toLowerCase() ||
          satisfiesPolicy(file.policy)
      ),
    [filesList, userRole, userDepartment, userAddress]
  );

  const fuse = useMemo(() => {
    return new Fuse(policyFilteredFiles, {
      keys: [
        { name: "fileName", weight: 2 }, // Higher weight for filename matches
        { name: "keywords", weight: 1 }, // Include keywords in search
      ],
      threshold: 0.3, // Slightly higher threshold for fuzziness
      includeScore: true,
      ignoreLocation: true,
      tokenize: true, // Split search query into individual keywords
      matchAllTokens: false, // OR search between keywords
    });
  }, [policyFilteredFiles]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFiles(policyFilteredFiles);
      setSearchTime(0);
      return;
    }

    const startTime = performance.now();
    const searchTerms = searchQuery
      .toLowerCase()
      .split(/[\s,]+/)
      .filter(Boolean);

    let combinedResults = [];
    searchTerms.forEach((term) => {
      combinedResults = [
        ...combinedResults,
        ...fuse.search(term).map((result) => result.item),
      ];
    });

    const endTime = performance.now();
    setSearchTime((endTime - startTime).toFixed(2));

    const uniqueFiles = Array.from(
      new Map(combinedResults.map((file) => [file.fileName, file])).values()
    );

    setFilteredFiles(uniqueFiles);
  }, [searchQuery, fuse, policyFilteredFiles]);

  const openDecryptModal = (file) => {
    setSelectedFile(file);
    setShowDecryptModal(true);
  };

  const closeDecryptModal = () => {
    setShowDecryptModal(false);
    setSelectedFile(null);
  };

  const generatePolicy = (role, department, operator) => {
    if (role && department) {
      setPolicy(`${role} ${operator} ${department}`);
    } else {
      setPolicy("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto p-6">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600">
            Store IPFS Hash on Blockchain
          </h1>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Upload Form */}
        <div className="bg-white shadow rounded p-6 mb-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                Filename:
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter file name"
              />
            </div>

            {/* Optional encrypted filename input */}
            {/* <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                Encrypted Filename:
              </label>
              <input
                type="text"
                value={encryptedFileName}
                onChange={(e) => setEncryptedFileName(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter encrypted filename"
              />
            </div> */}

            <div className="mb-4">
              {/* Role Dropdown */}
              <select
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  generatePolicy(e.target.value, department, policyOperator);
                }}
              >
                <option value="">Select Role</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {/* Operator Dropdown (AND/OR) */}
              <select
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2"
                value={policyOperator}
                onChange={(e) => {
                  setPolicyOperator(e.target.value);
                  generatePolicy(role, department, e.target.value);
                }}
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
              </select>

              {/* Department Dropdown */}
              <select
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  generatePolicy(role, e.target.value, policyOperator);
                }}
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              {/* Display Generated Policy */}
              <p className="mt-2 font-semibold">Policy: {policy}</p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                Upload File:
              </label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                Add Keywords:
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter keyword"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add
                </button>
              </div>
            </div>

            {keywords.length > 0 && (
              <div className="mb-4 bg-gray-50 p-4 rounded border">
                <h3 className="font-semibold mb-2 text-gray-700">Keywords:</h3>
                <ul className="list-disc pl-5">
                  {keywords.map((kw, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center text-gray-700"
                    >
                      {kw}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(index)}
                        className="ml-4 text-sm bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 focus:outline-none"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Submit
              </button>
            </div>
          </form>
        </div>

        {/* Files Table */}
        <div className="bg-white shadow rounded p-6">
          <header className="text-center mb-8">
            <div className="mb-4 bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                Logged in as: {userRole} ({userDepartment})
              </p>
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Multi-Keyword Search
            </h2>

            <input
              type="text"
              placeholder="Enter multiple keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
            />

            {/* Display search time */}
            <p className="text-gray-600 text-sm mb-4">
              Search time: {searchTime} ms
            </p>
          </header>
          <h2 className="text-2xl font-bold mb-4">Stored Files</h2>
          {filteredFiles.length === 0 ? (
            <p className="text-gray-700">No files stored yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Name
                    </th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IPFS Hash
                    </th> */}

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Policy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aes Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Keywords
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFiles.map((file, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {file.fileName}
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 break-all">
                        {file.ipfsHash}
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {file.owner?.toLowerCase() ===
                        userAddress?.toLowerCase() ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            Your File
                          </span>
                        ) : (
                          file.policy
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {file.encrypted_key}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {file.keywords.join(", ")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <button
                          onClick={() => openDecryptModal(file)}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none"
                        >
                          Decrypt & View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {showDecryptModal && selectedFile && (
        <DecryptModal file={selectedFile} onClose={closeDecryptModal} />
      )}
    </div>
  );
}

export default App;
