// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UserRegistry {
    struct User {
        address userAddress;
        string userName;
        string password; // Hashed password for authentication
        string name;
        string role;
        string department;
        string attributes; // CP-ABE attributes (e.g., "role:Doctor,department:Cardiology")
        string userKey; // Unique user key for CP-ABE encryption
        bool isRegistered;
    }

    mapping(address => User) public users;
    address public admin;
    address[] private userAddresses;

    string private systemPublicKey; // Global CP-ABE Public Key

    event UserRegistered(
        address indexed user,
        string userName,
        string name,
        string role,
        string department,
        string attributes
    );
    event UserKeySet(address indexed user, string userKey);
    event SystemPublicKeySet(string systemPublicKey);
    event UserLoggedIn(address indexed user, string userName);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyRegisteredUser() {
        require(users[msg.sender].isRegistered, "User not registered");
        _;
    }

    constructor(string memory _userName, string memory _password) {
        admin = msg.sender;

        // Register the admin user once
        users[admin] = User({
            userAddress: admin,
            userName: _userName,
            password: _password, // Store hashed password
            name: "Admin",
            role: "Admin",
            department: "Administration",
            attributes: "role:Admin",
            userKey: "",
            isRegistered: true
        });

        userAddresses.push(admin);

        emit UserRegistered(
            admin,
            _userName,
            "Admin",
            "Admin",
            "Administration",
            "role:Admin"
        );
    }

    function registerUser(
        address _userAddress,
        string memory _userName,
        string memory _password,
        string memory _name,
        string memory _role,
        string memory _department,
        string memory _attributes,
        string memory _userKey
    ) public onlyAdmin {
        require(!users[_userAddress].isRegistered, "User already registered");

        users[_userAddress] = User({
            userAddress: _userAddress,
            userName: _userName,
            password: _password, // Store hashed password
            name: _name,
            role: _role,
            department: _department,
            attributes: _attributes,
            userKey: _userKey,
            isRegistered: true
        });

        userAddresses.push(_userAddress);

        emit UserRegistered(
            _userAddress,
            _userName,
            _name,
            _role,
            _department,
            _attributes
        );
    }

    function setUserKey(string memory _userKey) public onlyRegisteredUser {
        users[msg.sender].userKey = _userKey;
        emit UserKeySet(msg.sender, _userKey);
    }

    function getUserKey(address _user) public view returns (string memory) {
        require(users[_user].isRegistered, "User not registered");
        return users[_user].userKey;
    }

    function setSystemPublicKey(
        string memory _systemPublicKey
    ) public onlyAdmin {
        require(
            bytes(systemPublicKey).length == 0,
            "System public key already set"
        );
        systemPublicKey = _systemPublicKey;
        emit SystemPublicKeySet(_systemPublicKey);
    }

    function getSystemPublicKey() public view returns (string memory) {
        require(
            bytes(systemPublicKey).length > 0,
            "System public key not set yet"
        );
        return systemPublicKey;
    }

    function loginUser(
        string memory _userName,
        string memory _password
    ) public returns (string memory) {
        require(users[msg.sender].isRegistered, "User not registered");
        require(
            keccak256(abi.encodePacked(users[msg.sender].userName)) ==
                keccak256(abi.encodePacked(_userName)),
            "Invalid username"
        );
        require(
            keccak256(abi.encodePacked(users[msg.sender].password)) ==
                keccak256(abi.encodePacked(_password)),
            "Invalid password"
        );

        emit UserLoggedIn(msg.sender, _userName);

        return users[msg.sender].userKey; // Return the userKey upon successful login
    }

    function getUserDetails(
        address _user
    )
        public
        view
        returns (
            string memory userName,
            string memory name,
            string memory role,
            string memory department,
            string memory attributes
        )
    {
        require(users[_user].isRegistered, "User not registered");
        return (
            users[_user].userName,
            users[_user].name,
            users[_user].role,
            users[_user].department,
            users[_user].attributes
        );
    }
}
