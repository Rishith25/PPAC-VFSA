export const API_URL = "http://127.0.0.1:7545";

// GATEWAY: https://gateway.pinata.cloud/ipfs/hashvalue

export const ADMIN_PRIVATE_KEY =
  "0xeeecddad6557e753e3c4cfddd78c094ceff1b4780bbd8f67584d7f3aac740403";

export const FilecontractAddress = "0xa461F097cB2C246373C395baB32774CF545dCF8A";
export const UsercontractAddress = "0x145014287e3Dfca767Ae60DAe684915f1317c5F5";
export const contractAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_userRegistryContract",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "string",
        name: "fileName",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "uniqueFileName",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "encryptedFileName",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "ipfsHash",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "aes_key",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "encrypted_key",
        type: "string",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "policy",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string[]",
        name: "bloomFilter",
        type: "string[]",
      },
    ],
    name: "FileUploaded",
    type: "event",
  },
  {
    inputs: [],
    name: "getAllFiles",
    outputs: [
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "fileName",
        type: "string",
      },
    ],
    name: "getFileDetails",
    outputs: [
      {
        internalType: "string",
        name: "uniqueFileName",
        type: "string",
      },
      {
        internalType: "string",
        name: "encryptedFileName",
        type: "string",
      },
      {
        internalType: "string",
        name: "ipfsHash",
        type: "string",
      },
      {
        internalType: "string",
        name: "aes_key",
        type: "string",
      },
      {
        internalType: "string",
        name: "encrypted_key",
        type: "string",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "string",
        name: "policy",
        type: "string",
      },
      {
        internalType: "string[]",
        name: "bloomFilter",
        type: "string[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "fileName",
        type: "string",
      },
    ],
    name: "getIPFSHash",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "fileName",
        type: "string",
      },
    ],
    name: "isFileStored",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "fileName",
        type: "string",
      },
      {
        internalType: "string",
        name: "uniqueFileName",
        type: "string",
      },
      {
        internalType: "string",
        name: "encryptedFileName",
        type: "string",
      },
      {
        internalType: "string",
        name: "ipfsHash",
        type: "string",
      },
      {
        internalType: "string",
        name: "aes_key",
        type: "string",
      },
      {
        internalType: "string",
        name: "encrypted_key",
        type: "string",
      },
      {
        internalType: "string",
        name: "policy",
        type: "string",
      },
      {
        internalType: "string[]",
        name: "bloomFilter",
        type: "string[]",
      },
    ],
    name: "upload",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "userRegistry",
    outputs: [
      {
        internalType: "contract UserRegistry",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "fileName",
        type: "string",
      },
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "verifyAccess",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

//UserABI
export const contractUserABI = [
  {
    inputs: [
      {
        internalType: "string",
        name: "_userName",
        type: "string",
      },
      {
        internalType: "string",
        name: "_password",
        type: "string",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "systemPublicKey",
        type: "string",
      },
    ],
    name: "SystemPublicKeySet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "userKey",
        type: "string",
      },
    ],
    name: "UserKeySet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "userName",
        type: "string",
      },
    ],
    name: "UserLoggedIn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "userName",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "role",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "department",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "attributes",
        type: "string",
      },
    ],
    name: "UserRegistered",
    type: "event",
  },
  {
    inputs: [],
    name: "admin",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSystemPublicKey",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_user",
        type: "address",
      },
    ],
    name: "getUserDetails",
    outputs: [
      {
        internalType: "string",
        name: "userName",
        type: "string",
      },
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "role",
        type: "string",
      },
      {
        internalType: "string",
        name: "department",
        type: "string",
      },
      {
        internalType: "string",
        name: "attributes",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_user",
        type: "address",
      },
    ],
    name: "getUserKey",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_userName",
        type: "string",
      },
      {
        internalType: "string",
        name: "_password",
        type: "string",
      },
    ],
    name: "loginUser",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_userAddress",
        type: "address",
      },
      {
        internalType: "string",
        name: "_userName",
        type: "string",
      },
      {
        internalType: "string",
        name: "_password",
        type: "string",
      },
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
      {
        internalType: "string",
        name: "_role",
        type: "string",
      },
      {
        internalType: "string",
        name: "_department",
        type: "string",
      },
      {
        internalType: "string",
        name: "_attributes",
        type: "string",
      },
      {
        internalType: "string",
        name: "_userKey",
        type: "string",
      },
    ],
    name: "registerUser",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_systemPublicKey",
        type: "string",
      },
    ],
    name: "setSystemPublicKey",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_userKey",
        type: "string",
      },
    ],
    name: "setUserKey",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "users",
    outputs: [
      {
        internalType: "address",
        name: "userAddress",
        type: "address",
      },
      {
        internalType: "string",
        name: "userName",
        type: "string",
      },
      {
        internalType: "string",
        name: "password",
        type: "string",
      },
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "role",
        type: "string",
      },
      {
        internalType: "string",
        name: "department",
        type: "string",
      },
      {
        internalType: "string",
        name: "attributes",
        type: "string",
      },
      {
        internalType: "string",
        name: "userKey",
        type: "string",
      },
      {
        internalType: "bool",
        name: "isRegistered",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export const PINATA_API_KEY = "2804eba38ea7909337be";
export const PINATA_SECRET_API_KEY =
  "e88430c06edf5982642480abe8d4eb7112619530405c823295e1302984cef101";
