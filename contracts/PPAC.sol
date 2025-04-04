// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./User.sol";

contract IPFSstorage {
    UserRegistry public userRegistry;

    struct File {
        string fileName;
        string uniqueFileName;
        string encryptedFileName;
        string ipfsHash;
        string aes_key;
        string encrypted_key;
        address owner;
        string policy;
        string[] bloomFilter; // Storing Bloom filter instead of plaintext keywords
    }

    mapping(string => File) private files;
    string[] private fileNames;

    event FileUploaded(
        string indexed fileName,
        string uniqueFileName,
        string encryptedFileName,
        string ipfsHash,
        string aes_key,
        string encrypted_key,
        address indexed owner,
        string policy,
        string[] bloomFilter
    );

    modifier onlyRegisteredUser() {
        (, , , , , , , , bool isRegistered) = userRegistry.users(msg.sender);
        require(isRegistered, "User not registered");
        _;
    }

    constructor(address _userRegistryContract) {
        userRegistry = UserRegistry(_userRegistryContract);
    }

    function upload(
        string memory fileName,
        string memory uniqueFileName,
        string memory encryptedFileName,
        string memory ipfsHash,
        string memory aes_key,
        string memory encrypted_key,
        string memory policy,
        string[] memory bloomFilter
    ) public onlyRegisteredUser {
        require(
            bytes(files[fileName].ipfsHash).length == 0,
            "File already exists"
        );

        files[fileName] = File({
            fileName: fileName,
            uniqueFileName: uniqueFileName,
            encryptedFileName: encryptedFileName,
            ipfsHash: ipfsHash,
            owner: msg.sender,
            policy: policy,
            bloomFilter: bloomFilter,
            aes_key: aes_key,
            encrypted_key: encrypted_key
        });

        fileNames.push(fileName);

        emit FileUploaded(
            fileName,
            uniqueFileName,
            encryptedFileName,
            ipfsHash,
            aes_key,
            encrypted_key,
            msg.sender,
            policy,
            bloomFilter
        );
    }

    function getIPFSHash(
        string memory fileName
    ) public view returns (string memory) {
        require(
            bytes(files[fileName].ipfsHash).length > 0,
            "File does not exist"
        );
        return files[fileName].ipfsHash;
    }

    function isFileStored(string memory fileName) public view returns (bool) {
        return bytes(files[fileName].ipfsHash).length > 0;
    }

    function getAllFiles() public view returns (string[] memory) {
        return fileNames;
    }

    function getFileDetails(
        string memory fileName
    )
        public
        view
        returns (
            string memory uniqueFileName,
            string memory encryptedFileName,
            string memory ipfsHash,
            string memory aes_key,
            string memory encrypted_key,
            address owner,
            string memory policy,
            string[] memory bloomFilter
        )
    {
        require(
            bytes(files[fileName].ipfsHash).length > 0,
            "File does not exist"
        );
        File storage file = files[fileName];
        return (
            file.uniqueFileName,
            file.encryptedFileName,
            file.ipfsHash,
            file.aes_key,
            file.encrypted_key,
            file.owner,
            file.policy,
            file.bloomFilter
        );
    }

    function verifyAccess(
        string memory fileName,
        address user
    ) public view returns (bool) {
        require(
            bytes(files[fileName].ipfsHash).length > 0,
            "File does not exist"
        );

        string memory userPrivateKey = userRegistry.getUserKey(user);
        require(bytes(userPrivateKey).length > 0, "User has no private key");

        return true; // Assuming CP-ABE decryption check is performed off-chain
    }
}
