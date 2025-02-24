# import os
# import base64
# import argparse
# from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
# from cryptography.hazmat.backends import default_backend
# from cryptography.hazmat.primitives import padding
# from cryptography.fernet import Fernet
# import nltk
# from nltk.corpus import stopwords
# from nltk.stem import PorterStemmer
# from collections import Counter
# import json

# nltk.download('stopwords')
# nltk.download('punkt')

# stemmer = PorterStemmer()

# custom_stop_words = set(stopwords.words('english')).union(set(['and', 'the', 'to', 'is', 'for', 'with', 'll', 'http', '123']))

# def generate_key():
#     return os.urandom(32), os.urandom(12)

# def load_key():
#     return open("secret.key", "rb").read()

# # def encrypt_file(file_name, key, nonce):
# #     file_path = os.path.join("pages", "uploads", file_name)
# #     with open(file_path, "rb") as file:
# #         file_data = file.read()

# #     padder = padding.PKCS7(128).padder()
# #     padded_data = padder.update(file_data) + padder.finalize()

# #     cipher = Cipher(algorithms.AES(key), modes.GCM(nonce), backend=default_backend())
# #     encryptor = cipher.encryptor()

# #     ciphertext = encryptor.update(padded_data) + encryptor.finalize()

# #     file_path = os.path.join("pages", "encrypted", f"{file_name}_encrypted")
# #     with open(file_path, "wb") as file:
# #         file.write(nonce)       # Prepend nonce to the file
# #         file.write(encryptor.tag)  # Then write the authentication tag
# #         file.write(ciphertext)   # Finally, write the ciphertext

# #     return f"{file_name}_encrypted"

# def encrypt_file(file_name, key, nonce):
#     input_path = os.path.join("pages", "uploads", file_name)
#     output_dir = os.path.join("pages", "encrypted")  
#     output_path = os.path.join(output_dir, f"{file_name}_encrypted")

#     os.makedirs(output_dir, exist_ok=True)

#     with open(input_path, "rb") as file:
#         file_data = file.read()

#     # Pad the data for AES encryption
#     padder = padding.PKCS7(128).padder()
#     padded_data = padder.update(file_data) + padder.finalize()

#     # Encrypt using AES-GCM
#     cipher = Cipher(algorithms.AES(key), modes.GCM(nonce), backend=default_backend())
#     encryptor = cipher.encryptor()
#     ciphertext = encryptor.update(padded_data) + encryptor.finalize()

#     # Write the encrypted file
#     with open(output_path, "wb") as file:
#         file.write(nonce)       # Prepend nonce
#         file.write(encryptor.tag)  # Write authentication tag
#         file.write(ciphertext)   # Write ciphertext

#     return f"{file_name}_encrypted"

# # Step 3: Encrypt the file using the generated key
# # def encrypt_file(file_name):
# #     key = load_key()  # Load encryption key
# #     fernet = Fernet(key)

# #     file_path = os.path.join("pages", "uploads", file_name)

# #     with open(file_path, "rb") as file:
# #         file_data = file.read()

# #     # Encrypt the file data
# #     encrypted_data = fernet.encrypt(file_data)

# #     # Write the encrypted data to a new file
# #     file_path = os.path.join("pages", "encrypted", f"{file_name}_encrypted")
# #     with open(file_path, "wb") as encrypted_file:
# #         encrypted_file.write(encrypted_data)

# #     return f"{file_name}_encrypted"

# def extract_keywords(text):
#     tokens = nltk.word_tokenize(text.lower())
#     filtered_tokens = [stemmer.stem(token) for token in tokens if token not in custom_stop_words and len(token) > 2]

#     word_counts = Counter(filtered_tokens)
    
#     filtered_keywords = {word: count for word, count in word_counts.items() if count > 1}
#     sorted_keywords = sorted(filtered_keywords.items(), key=lambda item: item[1], reverse=True)

#     keywords = [word for word, count in sorted_keywords]

#     # Optionally, include specific important keywords or phrases
#     # important_keywords = ['cypress', 'npm', 'production']  # Add any other important keywords you want to include
#     keywords = list(set(keywords ))  # Combine and remove duplicates

#     return keywords

# def process_file(file_name):
#     try:
#         file_path = os.path.join("pages", "uploads", file_name)
#         with open(file_path, 'rb') as f:
#             file_data = f.read()

#         file_content = file_data.decode('utf-8')  # Attempt to decode as UTF-8
#         keywords = extract_keywords(file_content)  # Extract keywords from the file content
#         # print("Extracted Keywords:", keywords)

#     except UnicodeDecodeError:
#         keywords = []

#     key, nonce = generate_key()
#     encrypted_file_name = encrypt_file(file_name, key, nonce)

#     return keywords, encrypted_file_name

# # # Generate a key once if not already done
# # try:
# #     load_key()
# # except FileNotFoundError:
# #     generate_key()  # Generate a key only if it doesn't exist

# parser = argparse.ArgumentParser(description="Encrypt a file and extract keywords.")
# parser.add_argument('file_name', type=str, help='The name of the file to process.')
# args = parser.parse_args()

# extracted_keywords, encrypted_file_name = process_file(args.file_name)

# output = {
#     "extracted_keywords": extracted_keywords,
#     "encrypted_file_name": encrypted_file_name
# }

# json_output = json.dumps(output)

# print(json_output)

import mimetypes
import os
import json
import nltk
import argparse
from collections import Counter
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding

nltk.download("stopwords")
nltk.download("punkt")

# Constants
UPLOAD_DIR = "pages/uploads"
ENCRYPT_DIR = "pages/encrypted"
CUSTOM_STOPWORDS = set(stopwords.words("english")).union({"and", "the", "to", "is", "for", "with", "ll", "http", "123"})

# Initialize Stemmer
stemmer = PorterStemmer()


def generate_key():
    return os.urandom(32), os.urandom(12)


def encrypt_file(file_name, key, nonce):
    """Encrypts a file using AES-GCM and saves it in encrypted directory."""
    os.makedirs(ENCRYPT_DIR, exist_ok=True)

    input_path = os.path.join(UPLOAD_DIR, file_name)
    output_path = os.path.join(ENCRYPT_DIR, f"{file_name}_encrypted")

    with open(input_path, "rb") as file:
        file_data = file.read()

    # Padding
    padder = padding.PKCS7(128).padder()
    padded_data = padder.update(file_data) + padder.finalize()

    # AES-GCM Encryption
    cipher = Cipher(algorithms.AES(key), modes.GCM(nonce), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(padded_data) + encryptor.finalize()

    # Save encrypted file
    with open(output_path, "wb") as file:
        file.write(nonce + encryptor.tag + ciphertext)

    return f"{file_name}_encrypted"


def extract_keywords(text):
    """Extracts keywords by tokenizing, removing stopwords, and stemming."""
    tokens = nltk.word_tokenize(text.lower())
    filtered_tokens = [stemmer.stem(token) for token in tokens if token not in CUSTOM_STOPWORDS and len(token) > 2]

    word_counts = Counter(filtered_tokens)
    keywords = [word for word, count in word_counts.items() if count > 1]

    return list(set(keywords))

def process_file(file_name):
    file_path = os.path.join(UPLOAD_DIR, file_name)
    mime_type, _ = mimetypes.guess_type(file_path)

    with open(file_path, "rb") as f:
        file_data = f.read()

    # Process text files for keyword extraction
    if mime_type and mime_type.startswith("text"):
        try:
            file_content = file_data.decode("utf-8")
            keywords = extract_keywords(file_content)
        except UnicodeDecodeError:
            keywords = []
    else:
        keywords = []  # Skip keyword extraction for binary files

    # Encrypt the file
    key, nonce = generate_key()
    # Debugging: Log key and nonce safely
    # print("Encryption Key:", key.hex())  
    # print("Nonce:", nonce.hex()) 
    encrypted_file_name = encrypt_file(file_name, key, nonce)
    print(json.dumps({"encrypted_file_name": encrypted_file_name, "extracted_keywords": keywords}))
    return keywords, encrypted_file_name

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("file_name", type=str, help="File name to encrypt and extract keywords")
    args = parser.parse_args()
    
    process_file(args.file_name)
