import os
import json
import argparse
import mimetypes
import nltk
import secrets
from collections import Counter
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer

# Ensure necessary NLTK data is available
nltk.download("stopwords", quiet=True)
nltk.download("punkt", quiet=True)

UPLOAD_DIR = os.path.join("pages", "uploads")
ENCRYPT_DIR = os.path.join("pages", "encrypted")
CUSTOM_STOPWORDS = set(stopwords.words("english")).union(
    {"and", "the", "to", "is", "for", "with", "ll", "http", "123"}
)

stemmer = PorterStemmer()


# Manual CP-ABE Implementation
class BilinearPairing:
    def __init__(self, g, p):
        self.g = g  # Generator
        self.p = p  # Prime order

    def pairing(self, a, b):
        return (a * b) % self.p


class CPABE:
    def __init__(self, pairing):
        self.pairing = pairing

    def setup(self):
        g = secrets.randbelow(self.pairing.p)
        pk = g  # Public key
        msk = secrets.randbelow(self.pairing.p)  # Master secret key
        return pk, msk

    def keygen(self, pk, msk, attributes):
        sk = {
            attr: (msk * secrets.randbelow(self.pairing.p)) % self.pairing.p
            for attr in attributes
        }
        return sk

    def encrypt(self, pk, message, policy):
        secret = secrets.randbelow(self.pairing.p)
        ciphertext = [
            (ord(char) * pk * secret) % self.pairing.p
            for char in message.decode("utf-8", "ignore")
        ]
        return {"ciphertext": ciphertext, "policy": policy, "secret": secret}

    def decrypt(self, sk, ciphertext):
        if not all(
            attr in sk for attr in ciphertext["policy"].split() if attr.isalnum()
        ):
            raise ValueError("Access Denied: Attributes do not satisfy policy")

        secret = ciphertext["secret"]
        message = "".join(
            chr((char // (sk[list(sk.keys())[0]] * secret)) % self.pairing.p)
            for char in ciphertext["ciphertext"]
        )
        return message


pairing = BilinearPairing(g=2, p=7919)
abesystem = CPABE(pairing)

pk, msk = abesystem.setup()


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


def process_file(file_name, user_role, user_department):
    file_path = os.path.join(UPLOAD_DIR, file_name)
    mime_type, _ = mimetypes.guess_type(file_path)

    with open(file_path, "rb") as f:
        file_data = f.read()

    keywords = []
    if mime_type and mime_type.startswith("text"):
        try:
            text = file_data.decode("utf-8")
            keywords = extract_keywords(text)
        except UnicodeDecodeError:
            pass

    policy = f"{user_role} {user_department}"
    user_key = abesystem.keygen(pk, msk, {user_role, user_department})
    encrypted_data = abesystem.encrypt(pk, file_data, policy)

    encrypted_file_name = f"{file_name}_encrypted.json"
    encrypted_file_path = os.path.join(ENCRYPT_DIR, encrypted_file_name)
    os.makedirs(ENCRYPT_DIR, exist_ok=True)

    with open(encrypted_file_path, "w") as f:
        json.dump(encrypted_data, f)

    output = {
        "encrypted_file_name": encrypted_file_name,
        "extracted_keywords": keywords,
        "policy": policy,
    }
    print(json.dumps(output))
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Encrypt a file using manual CP-ABE and extract keywords."
    )
    parser.add_argument("file_name", type=str, help="File name (in pages/uploads)")
    parser.add_argument("user_role", type=str, help="User role (for CP-ABE policy)")
    parser.add_argument(
        "user_department", type=str, help="User department (for CP-ABE policy)"
    )
    args = parser.parse_args()

    process_file(args.file_name, args.user_role, args.user_department)
