import json
import os
import sys
import hashlib

# Directories
ENCRYPT_DIR = os.path.join(os.getcwd(), "pages/encrypted")
if not os.path.exists(ENCRYPT_DIR):
    os.makedirs(ENCRYPT_DIR)

# Large prime (same as in key generation)
PRIME = 2**256 - 2**224 + 2**192 + 2**96 - 1


def load_public_key():
    """Load the public key from public.key file."""
    with open("public.key", "r") as f:
        pk = json.load(f)
    return pk["g"], pk["g_alpha"]


def generate_session_key(public_key, file_content):
    """
    Generates a session key using CP-ABE principles.
    """
    file_hash = int(hashlib.sha256(file_content).hexdigest(), 16) % PRIME
    session_key = pow(public_key, file_hash, PRIME)  # g^(H(file)) mod p
    return session_key


def encrypt_file(file_path, public_key):
    """
    Encrypts a file using CP-ABE-based encryption.
    """
    # Read file content
    with open(file_path, "rb") as f:
        plaintext = f.read()

    # Generate a session key
    session_key = generate_session_key(public_key, plaintext)

    # Encrypt content (XOR encryption)
    encrypted_content = bytes([b ^ (session_key % 256) for b in plaintext])

    # Save encrypted file
    encrypted_file_name = os.path.basename(file_path) + ".enc"
    encrypted_file_path = os.path.join(ENCRYPT_DIR, encrypted_file_name)
    with open(encrypted_file_path, "wb") as f:
        f.write(encrypted_content)

    return encrypted_file_name


if __name__ == "__main__":
    try:
        # Get input file from arguments
        file_path = sys.argv[1]

        # Load public key
        g, g_alpha = load_public_key()

        # Encrypt file
        encrypted_file_name = encrypt_file(file_path, g_alpha)

        # Extract keywords (dummy logic)
        extracted_keywords = ["secure", "blockchain"]

        # Output result as JSON
        print(
            json.dumps(
                {
                    "encrypted_file_name": encrypted_file_name,
                    "extracted_keywords": extracted_keywords,
                }
            )
        )

    except Exception as e:
        print(json.dumps({"error": str(e)}))
# Usage: python scripts/cpabe.py <file_path>
# Example: python scripts/cpabe.py pages/sample.txt
# Output: {"encrypted_file_name": "sample.txt.enc", "extracted_keywords": ["secure", "blockchain"]}
