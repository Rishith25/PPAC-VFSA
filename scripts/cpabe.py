from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import json
import os
import pickle
import ast
from charm.toolbox.pairinggroup import (
    PairingGroup,
    ZR,
    G1,
    G2,
    GT,
    serialize,
    deserialize,
)
from charm.schemes.abenc.abenc_bsw07 import CPabe_BSW07

app = Flask(__name__)
CORS(app)

# # Initialize CP-ABE
group = PairingGroup("MNT224")
cpabe = CPabe_BSW07(group)
user_keys = {}


PUBLIC_KEY_FILE = "data/public_key.key"
MASTER_KEY_FILE = "data/master_key.key"


def save_key(file_path, key_data):
    """Saves the key data as a JSON string to a file."""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "w") as mast_file:
        json.dump(key_data, mast_file, indent=4, default=str)


def load_key(file_path):
    """Loads the key data from a file."""
    if os.path.exists(file_path):
        # Retrieve keys from files
        with open(file_path, "r") as pub_file:
            return json.load(pub_file)
    return None  # Return None if file doesn't exist


def get_or_create_key():
    """Retrieves the key parameters if they exist, otherwise generates and saves new ones."""
    group = PairingGroup("MNT224")  # Initialize pairing group
    cpabe = CPabe_BSW07(group)

    public_key_data = load_key(PUBLIC_KEY_FILE)
    master_key_data = load_key(MASTER_KEY_FILE)

    if public_key_data and master_key_data:
        public_key = {
            k: group.deserialize(v.encode()) for k, v in public_key_data.items()
        }
        master_key = {
            k: group.deserialize(v.encode()) for k, v in master_key_data.items()
        }

        print("✅ Keys loaded successfully.")

        return public_key, master_key

    else:
        print("🔹 Generating new keys...")
        public_key, master_key = cpabe.setup()

        public_key_serialized = {
            k: group.serialize(v).decode() for k, v in public_key.items()
        }
        master_key_serialized = {
            k: group.serialize(v).decode() for k, v in master_key.items()
        }

        save_key(PUBLIC_KEY_FILE, public_key_serialized)
        save_key(MASTER_KEY_FILE, master_key_serialized)

    return public_key, master_key


def setup():
    """Initialize CP-ABE system."""
    public_key, master_key = get_or_create_key()
    return public_key, master_key


@app.route("/")
def home():
    return jsonify({"message": "CP-ABE Flask API is running!"})


@app.route("/encrypt", methods=["POST"])
def encrypt():
    """Encrypt the secret key using CP-ABE."""
    data = request.json
    aes_key = data.get("aes_key")
    policy = data.get("policy")

    if not aes_key or not policy:
        return jsonify({"error": "Missing secret_key or policy"}), 400

    public_key, master_key = setup()

    hashed_message = group.hash(aes_key, ZR)  # Hash to ZR (exponent group)
    original_message = group.random(GT) ** hashed_message  # Convert to GT element
    ciphertext = cpabe.encrypt(public_key, original_message, policy)

    print("\n✅ Message encrypted successfully!")

    ciphertext_str = json.dumps(
        {
            k: base64.b64encode(bytes(str(v), "utf-8")).decode()
            for k, v in ciphertext.items()
        }
    )

    return jsonify(
        {"message": "Secret key encrypted successfully", "ciphertext": ciphertext_str}
    )


def base64_to_python_object(encoded_str):
    """Decode base64-encoded string and convert it back to a Python object using ast.literal_eval."""
    try:
        decoded_bytes = base64.b64decode(encoded_str)
        decoded_str = decoded_bytes.decode("utf-8")
        return ast.literal_eval(
            decoded_str
        )  # Convert back into Python objects (lists, dicts, ints)
    except Exception:
        return encoded_str  # If it fails, return the original value


def deserialize_dict(sk_key_json):
    """Deserialize the sk_key JSON while handling base64 decoding and maintaining structure."""
    deserialized_sk = {}

    for key, value in sk_key_json.items():
        if isinstance(value, str):  # Base64 encoded string case
            deserialized_sk[key] = base64_to_python_object(value)
        elif isinstance(value, dict):  # Nested dictionary case (like Dj, Djp)
            deserialized_sk[key] = {
                sub_key: base64_to_python_object(sub_value)
                for sub_key, sub_value in value.items()
            }
        elif isinstance(value, list):  # If `S` or other lists are stored as JSON lists
            deserialized_sk[key] = value
        else:
            deserialized_sk[key] = value  # If it’s already in correct format, keep it

    return deserialized_sk


@app.route("/decrypt", methods=["POST"])
def decrypt():
    """Simulated decryption of AES key using CP-ABE (Dummy Version)"""
    try:
        data = request.json

        decrypted_key = "dummy_decrypted_key_12345"

        return jsonify(
            {"message": "Decryption successful", "decrypted_key": decrypted_key}
        )

    except Exception as e:
        print(f"Decryption error: {str(e)}")
        return jsonify({"error": f"Decryption failed: {str(e)}"}), 500


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


@app.route("/userSecretGen", methods=["POST"])
def userSecretGen():
    """Encrypt the secret key using CP-ABE."""
    data = request.json
    attr = data.get("attr")

    if not attr:
        return jsonify({"error": "Missing att"}), 400

    public_key, master_key = setup()

    sk_user = cpabe.keygen(public_key, master_key, list(attr))

    serialized_sk_user = serialize_dict(sk_user)

    return jsonify(serialized_sk_user)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
