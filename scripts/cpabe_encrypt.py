# cpabe_encrypt.py
from charm.toolbox.pairinggroup import PairingGroup, GT  # type: ignore
from charm.schemes.abenc.abenc_bsw07 import CPabe_BSW07  # type: ignore


def cpabe_setup():
    # Initialize pairing group (symmetric) and CP-ABE scheme
    group = PairingGroup("SS512")
    cpabe = CPabe_BSW07(group)

    # Generate public key and master key
    public_key, master_key = cpabe.setup()
    return cpabe, group, public_key, master_key


def cpabe_encrypt(cpabe, group, public_key, aes_key_bytes, policy_str):
    # Convert the AES key to a group element.
    # In practice, you might want to encrypt a key that is represented as a string (or bytes) by using a hybrid encryption approach.
    # For demonstration, we treat the AES key as a string.
    # NOTE: Make sure the data is in the correct format (e.g., string).
    aes_key_str = aes_key_bytes.hex()  # converting bytes to hex string representation
    ciphertext = cpabe.encrypt(public_key, aes_key_str, policy_str)
    # Optionally, serialize the ciphertext (e.g., using json)
    serialized_ct = group.serialize(ciphertext)
    return serialized_ct


def cpabe_decrypt(cpabe, group, public_key, master_key, user_key, serialized_ct):
    # Deserialize the ciphertext
    ciphertext = group.deserialize(serialized_ct)
    # Decrypt using the user key
    decrypted_aes_key_str = cpabe.decrypt(public_key, user_key, ciphertext)
    # Convert hex string back to bytes
    return bytes.fromhex(decrypted_aes_key_str)


def cpabe_keygen(cpabe, group, public_key, master_key, user_attributes):
    # user_attributes should be a list of strings, e.g., ["role:Admin", "department:Finance"]
    user_key = cpabe.keygen(public_key, master_key, user_attributes)
    return user_key


# Example usage:
if __name__ == "__main__":
    # 1. CP-ABE Setup
    cpabe, group, public_key, master_key = cpabe_setup()

    # 2. Define a CP-ABE policy based on user attributes.
    # Here our policy is: (role:Admin OR role:Manager) AND department:Finance
    policy = "((role:Admin OR role:Manager) AND department:Finance)"

    # Suppose we already generated an AES key in the AES encryption section:
    import os

    aes_key = os.urandom(32)  # same key used for AES encryption

    # 3. Encrypt the AES key using CP-ABE with the given policy.
    serialized_ciphertext = cpabe_encrypt(cpabe, group, public_key, aes_key, policy)
    # Save serialized_ciphertext (this is what you would store on-chain or in a database)
    with open("encrypted_aes_key.json", "wb") as f:
        f.write(serialized_ciphertext)
    print("AES key has been encrypted with CP-ABE.")

    # 4. Simulate a user with attributes trying to decrypt:
    # For example, a user registering via your React front-end might supply these:
    user_attributes = [
        "role:Admin",
        "department:Finance",
        "name:Alice",
    ]  # user attributes from your state
    user_key = cpabe_keygen(cpabe, group, public_key, master_key, user_attributes)

    # 5. Decrypt the AES key:
    with open("encrypted_aes_key.json", "rb") as f:
        serialized_ct = f.read()
    decrypted_aes_key = cpabe_decrypt(
        cpabe, group, public_key, master_key, user_key, serialized_ct
    )
    print("Decrypted AES key (matches original):", decrypted_aes_key == aes_key)
