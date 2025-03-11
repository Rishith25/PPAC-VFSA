#!/usr/bin/env python3
import os
import secrets
import json
import argparse
import mimetypes
import nltk
from collections import Counter
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding

# Ensure necessary NLTK data is available
nltk.download("stopwords", quiet=True)
nltk.download("punkt", quiet=True)

# Constants and directories
UPLOAD_DIR = os.path.join("pages", "uploads")
ENCRYPT_DIR = os.path.join("pages", "encrypted")
KEY_FILE = "secret.key"
CUSTOM_STOPWORDS = set(stopwords.words("english")).union(
    {"and", "the", "to", "is", "for", "with", "ll", "http", "123"}
)

stemmer = PorterStemmer()


def generate_key():
    return secrets.token_bytes(32)


def save_key(key):
    with open(KEY_FILE, "w") as f:
        f.write(key.hex())


def get_or_create_key():
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, "r") as f:
            hex_key = f.read().strip()
        try:
            return bytes.fromhex(hex_key)
        except ValueError:
            print("Invalid key in secret.key, generating a new one.")
            key = generate_key()
            save_key(key)
            return key
    else:
        key = generate_key()
        save_key(key)
        return key


def generate_nonce():
    return secrets.token_bytes(12)


def encrypt_file(file_name, key, nonce):
    os.makedirs(ENCRYPT_DIR, exist_ok=True)
    input_path = os.path.join(UPLOAD_DIR, file_name)
    output_file = f"{file_name}_encrypted"
    output_path = os.path.join(ENCRYPT_DIR, output_file)

    with open(input_path, "rb") as file:
        file_data = file.read()

    # PKCS7 padding
    padder = padding.PKCS7(128).padder()
    padded_data = padder.update(file_data) + padder.finalize()

    # Encrypt with AES-GCM
    cipher = Cipher(algorithms.AES(key), modes.GCM(nonce), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(padded_data) + encryptor.finalize()
    tag = encryptor.tag  # 16 bytes

    # Save encrypted file as: nonce | tag | ciphertext
    with open(output_path, "wb") as file:
        file.write(nonce + tag + ciphertext)

    return output_file


def extract_keywords(text):
    tokens = nltk.word_tokenize(text.lower())
    filtered_tokens = [
        stemmer.stem(token)
        for token in tokens
        if token not in CUSTOM_STOPWORDS and len(token) > 2
    ]
    counts = Counter(filtered_tokens)
    keywords = [word for word, count in counts.items() if count > 1]
    return list(set(keywords))


def process_file(file_name):
    file_path = os.path.join(UPLOAD_DIR, file_name)
    mime_type, _ = mimetypes.guess_type(file_path)
    with open(file_path, "rb") as f:
        file_data = f.read()

    # If text file, extract keywords
    if mime_type and mime_type.startswith("text"):
        try:
            text = file_data.decode("utf-8")
            keywords = extract_keywords(text)
        except UnicodeDecodeError:
            keywords = []
    else:
        keywords = []

    key = get_or_create_key()  # load or create a key
    nonce = generate_nonce()  # generate a new nonce for each encryption

    encrypted_file_name = encrypt_file(file_name, key, nonce)
    output = {
        "encrypted_file_name": encrypted_file_name,
        "extracted_keywords": keywords,
    }
    print(json.dumps(output))  # Only JSON output
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Encrypt a file and extract keywords.")
    parser.add_argument("file_name", type=str, help="File name (in pages/uploads)")
    args = parser.parse_args()
    process_file(args.file_name)
