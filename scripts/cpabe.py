from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import json
import os
import pickle
import ast
from charm.toolbox.pairinggroup import PairingGroup, ZR, G1, G2, GT, serialize, deserialize
from charm.schemes.abenc.abenc_bsw07 import CPabe_BSW07

app = Flask(__name__)
CORS(app)

# # Initialize CP-ABE
group = PairingGroup('MNT224')
cpabe = CPabe_BSW07(group)
# (public_key, master_key) = cpabe.setup()
user_keys = {}


PUBLIC_KEY_FILE = "data/public_key.key"
MASTER_KEY_FILE = "data/master_key.key"

def save_key(file_path, key_data):
    """Saves the key data as a JSON string to a file."""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)  # Ensure directory exists
    with open(file_path, 'w') as mast_file:
        json.dump(key_data, mast_file, indent=4, default=str)

def load_key(file_path):
    """Loads the key data from a file."""
    if os.path.exists(file_path):
        # Retrieve keys from files
        with open(file_path, 'r') as pub_file:
            return json.load(pub_file)
    return None  # Return None if file doesn't exist

# def convert_json_values(data):
#     """
#     Converts string representations of lists and integers back to their original format.
#     Uses `ast.literal_eval()` to safely parse lists from strings.
#     """
#     if isinstance(data, dict):
#         return {k: convert_json_values(v) for k, v in data.items()}
#     elif isinstance(data, str) and (data.startswith("[") or data.isdigit()):
#         try:
#             return ast.literal_eval(data)  # Convert only valid lists or numbers
#         except (ValueError, SyntaxError):
#             return data  # If it's not a valid list or number, return as is
#     return data  # Return original if it's not a string

# def convert_json_values(data):
#     """
#     Converts JSON strings back to original format while ensuring
#     double quotes for all strings.
#     """
#     if isinstance(data, dict):
#         return {k: json.loads(v) if isinstance(v, str) else v for k, v in data.items()}
#     elif isinstance(data, str):
#         try:
#             return json.loads(data)  # Convert only valid JSON strings
#         except json.JSONDecodeError:
#             return data  # Keep as string if not JSON
#     return data

def get_or_create_key():
    """Retrieves the key parameters if they exist, otherwise generates and saves new ones."""
    group = PairingGroup('MNT224')  # Initialize pairing group
    cpabe = CPabe_BSW07(group)

    print("group:")
    print(group)

    print("///////////")

    public_key_data = load_key(PUBLIC_KEY_FILE)
    master_key_data = load_key(MASTER_KEY_FILE)

    

    if public_key_data and master_key_data:

        public_key = {k: group.deserialize(v.encode()) for k, v in public_key_data.items()}
        master_key = {k: group.deserialize(v.encode()) for k, v in master_key_data.items()}

        print("✅ Keys loaded successfully.")


        return public_key, master_key
        
        
        
    else:
        print("🔹 Generating new keys...")
        public_key, master_key = cpabe.setup()

        public_key_serialized = {k: group.serialize(v).decode() for k, v in public_key.items()}
        master_key_serialized = {k: group.serialize(v).decode() for k, v in master_key.items()}

        save_key(PUBLIC_KEY_FILE, public_key_serialized)
        save_key(MASTER_KEY_FILE, master_key_serialized)


    return public_key, master_key
    
def setup():
    """Initialize CP-ABE system."""
    public_key, master_key = get_or_create_key()
    return public_key, master_key

def keygen(cpabe, public_key, master_key, attributes):
    """Generate a secret key for a user based on attributes."""
    return cpabe.keygen(public_key, master_key, list(attributes))

def encrypt1(cpabe, public_key, message, policy, group):
    """Convert a string message into GT element and encrypt it."""
    hashed_message = group.hash(message, ZR)  # Hash to ZR (exponent group)
    message_as_element = group.random(GT) ** hashed_message  # Convert to GT element
    ciphertext = cpabe.encrypt(public_key, message_as_element, policy)
    return ciphertext, message_as_element  # Return ciphertext & original GT element

def decrypt(cpabe, public_key, secret_key, ciphertext):
    """Decrypt and return the message."""
    try:
        decrypted_msg = cpabe.decrypt(public_key, secret_key, ciphertext)
        return decrypted_msg
    except Exception as e:
        return str(e)

@app.route('/')
def home():
    return jsonify({"message": "CP-ABE Flask API is running!"})

@app.route('/keygen', methods=['POST'])
def keygen1():
    """Generate a CP-ABE private key for a user with attributes."""
    data = request.json
    user_id = data.get("user_id")
    attributes = data.get("attributes", [])

    if not user_id or not attributes:
        return jsonify({"error": "Missing user_id or attributes"}), 400

    user_keys[user_id] = cpabe.keygen(public_key, master_key, attributes)
    return jsonify({"message": f"Key generated for {user_id}", "attributes": attributes})

@app.route('/encrypt', methods=['POST'])
def encrypt():
    """Encrypt the secret key using CP-ABE."""
    data = request.json
    aes_key = data.get("aes_key")
    policy = data.get("policy")
    print(aes_key)
    if not aes_key or not policy:
        return jsonify({"error": "Missing secret_key or policy"}), 400

    # Convert secret_key string to an element in GT (not G1)
    # message_element = group.hash(secret_key, G1)  # ✅ Hash into GT

    # # Encrypt the message with CP-ABE
    # ciphertext = cpabe.encrypt(public_key, message_element, policy)

    # # Convert ciphertext to Base64-encoded JSON format
    # ciphertext_str = base64.b64encode(str(ciphertext).encode()).decode()

    # return jsonify({
    #     "message": "Secret key encrypted successfully",
    #     "ciphertext": ciphertext_str
    # })

    public_key, master_key = setup()

    # Step 4: Encrypt a Message

    ciphertext, original_message = encrypt1(cpabe, public_key, aes_key, policy, group)
    print("\n✅ Message encrypted successfully!")

    ciphertext_str = json.dumps({k: base64.b64encode(bytes(str(v), "utf-8")).decode() for k, v in ciphertext.items()})


    return jsonify({
        "message": "Secret key encrypted successfully",
        "ciphertext": ciphertext_str
    })

    # Step 5: Attempt Decryption
    # decrypted_msg1 = decrypt(cpabe, public_key, sk_user1, ciphertext)
    # decrypted_msg2 = decrypt(cpabe, public_key, sk_user2, ciphertext)

    # # Step 6: Print Decryption Results
    # print("\n🔐 *Decryption Results:*")
    # print(f"🔹 Original Message (Hashed GT Element): {ciphertext}")
    
    # if isinstance(decrypted_msg1, str):
    #     print("❌ User 1 failed to decrypt the message.")
    # else:
    #     print(f"✔ User 1 Decrypted Message: {decrypted_msg1}")
    #     print(f"✅ Match: {decrypted_msg1 == original_message}")

    # if isinstance(decrypted_msg2, str):
    #     print("❌ User 2 failed to decrypt the message.")
    # else:
    #     print(f"✔ User 2 Decrypted Message: {decrypted_msg2}")
    #     print(f"✅ Match: {decrypted_msg2 == original_message}")

def serialize_key(key):
    """ Recursively serialize group elements into JSON-compatible format """
    if isinstance(key, dict):
        return {k: serialize_key(v) for k, v in key.items()}
    elif isinstance(key, list):
        return [serialize_key(v) for v in key]
    elif isinstance(key, (ZR, G1, G2, GT)):  # These are the types used in Charm-Crypto
        return group.serialize(key).decode()  # Ensure this returns a string
    else:
        return key  # Keep normal types (int, str, etc.) unchanged

def serialize_dict(data):
    """Recursively serialize CP-ABE keys to ensure they can be transmitted properly."""
    if isinstance(data, dict):
        return {k: serialize_dict(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [serialize_dict(v) for v in data]
    elif isinstance(data, bytes):  # Handle direct byte encoding
        return base64.b64encode(data).decode()
    elif isinstance(data, str):  # Already a string, return as is
        return data
    elif isinstance(data, type(group.random(GT))):  # Handle pairing elements
        return base64.b64encode(serialize(data)).decode()  
    else:
        return str(data)  # Convert unknown types to string


@app.route('/userSecretGen', methods=['POST'])
def userSecretGen():
    """Encrypt the secret key using CP-ABE."""
    data = request.json
    attr = data.get("attr")
    if not attr:
        return jsonify({"error": "Missing att"}), 400

    public_key, master_key = setup()
    print(public_key)
    print("////////")
    print(master_key)

    # Step 3: Generate Secret Keys
    sk_user = keygen(cpabe, public_key, master_key, attr)

    print("Sk_user")

    print(sk_user)
    
    serialized_sk_user = serialize_dict(sk_user)

    print("serialized key:")

    print(serialized_sk_user)

    print("//////////////")

    
    return jsonify(serialized_sk_user)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)