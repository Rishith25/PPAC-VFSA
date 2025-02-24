#!/usr/bin/env python3
import os, json, base64, argparse
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding

KEY_FILE = "secret.key"
ENCRYPT_DIR = os.path.join("pages", "encrypted")

def load_key():
    with open(KEY_FILE, "r") as f:
        hex_key = f.read().strip()
    return bytes.fromhex(hex_key)

def decrypt_file(encrypted_file_path, key):
    with open(encrypted_file_path, "rb") as f:
        data = f.read()
    
    nonce = data[:12]      # First 12 bytes
    tag = data[12:28]      # Next 16 bytes
    ciphertext = data[28:] # Remaining bytes
    
    cipher = Cipher(algorithms.AES(key), modes.GCM(nonce, tag), backend=default_backend())
    decryptor = cipher.decryptor()
    padded_plaintext = decryptor.update(ciphertext) + decryptor.finalize()
    
    unpadder = padding.PKCS7(128).unpadder()
    plaintext = unpadder.update(padded_plaintext) + unpadder.finalize()
    return plaintext

def main():
    parser = argparse.ArgumentParser(description="Decrypt a file and return content as base64.")
    parser.add_argument("encrypted_file_name", type=str, help="Name of the encrypted file in ENCRYPT_DIR")
    args = parser.parse_args()

    encrypted_file_path = os.path.join(ENCRYPT_DIR, args.encrypted_file_name)
    original_filename = args.encrypted_file_name.replace("_encrypted", "")
    key = load_key()

    try:
        decrypted_bytes = decrypt_file(encrypted_file_path, key)
        # Ensure output is a clean Base64 string
        b64_content = base64.b64encode(decrypted_bytes).decode("utf-8").strip()
        output = {
            "original_filename": original_filename,
            "decrypted_content": b64_content
        }
        print(json.dumps(output))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
