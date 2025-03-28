import { ethers } from "ethers";
import UserRegistryABI from "../contracts/UserRegistry.json";
import IPFSStorageABI from "../contracts/IPFSStorage.json";

const USER_REGISTRY_ADDRESS = "0xDEbf30BB75350bA710666EF62662616f6cc0568e";
const IPFS_STORAGE_ADDRESS = "0x3f182394E69B01630EF4661BBb661Aad015520D7";

let provider;
let signer;

// Connect to Metamask
export const connectWallet = async () => {
  if (!window.ethereum) throw new Error("Metamask not detected");

  provider = new ethers.BrowserProvider(window.ethereum);
  await window.ethereum.request({ method: "eth_requestAccounts" });
  signer = await provider.getSigner();

  return await signer.getAddress();
};

// Get Smart Contract Instance
const getEthereumContract = (address, abi) => {
  if (!signer) throw new Error("Wallet not connected");
  return new ethers.Contract(address, abi, signer);
};

// Register User
export const registerUser = async (name, role, department, attributes) => {
  const contract = getEthereumContract(USER_REGISTRY_ADDRESS, UserRegistryABI);
  const tx = await contract.registerUser(name, role, department, attributes);
  await tx.wait();
};

// Upload File Metadata
export const uploadFileMetadata = async (
  fileName,
  uniqueFileName,
  encryptedFileName,
  ipfsHash,
  policy,
  keywords
) => {
  const contract = getEthereumContract(IPFS_STORAGE_ADDRESS, IPFSStorageABI);
  const tx = await contract.upload(
    fileName,
    uniqueFileName,
    encryptedFileName,
    ipfsHash,
    policy,
    keywords
  );
  await tx.wait();
};

// Fetch All Files
export const getAllFiles = async () => {
  const contract = getEthereumContract(IPFS_STORAGE_ADDRESS, IPFSStorageABI);
  return await contract.getAllFiles();
};
