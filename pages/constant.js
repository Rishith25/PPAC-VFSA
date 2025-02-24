export const API_URL = "http://127.0.0.1:7545";

export const PRIVATE_KEY =
  "0xec4f1c236c7373817b55195f9dbdd8d98b2e821869e1f1a33c50f24d1e2957e4";
export const PRIVATE_KEY_USER =
  "0xa3a0b59c8e3d90e61b1e57514f08735439b9bb768e5ee340c1d3951fe2525928";
export const FilecontractAddress = "0xC6Ca79BC878a682277F86ec08DE9A6866095a265";
export const UsercontractAddress = "0xc1eDD74c891bD23a07a4c044F3458191040cddd7";
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
        name: "keywords",
        type: "string[]",
      },
    ],
    name: "FileUploaded",
    type: "event",
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
        name: "policy",
        type: "string",
      },
      {
        internalType: "string[]",
        name: "keywords",
        type: "string[]",
      },
    ],
    name: "upload",
    outputs: [],
    stateMutability: "nonpayable",
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
        name: "keywords",
        type: "string[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export const contractUserABI = [
  {
    inputs: [
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
    ],
    name: "registerUser",
    outputs: [],
    stateMutability: "nonpayable",
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
    name: "getUser",
    outputs: [
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
        internalType: "bool",
        name: "isRegistered",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllUsers",
    outputs: [
      {
        internalType: "struct UserRegistry.User[]",
        name: "",
        type: "tuple[]",
        components: [
          {
            internalType: "address",
            name: "userAddress",
            type: "address",
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
            internalType: "bool",
            name: "isRegistered",
            type: "bool",
          },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export const PINATA_API_KEY = "2804eba38ea7909337be";
export const PINATA_SECRET_API_KEY =
  "e88430c06edf5982642480abe8d4eb7112619530405c823295e1302984cef101";
