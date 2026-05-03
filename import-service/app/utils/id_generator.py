# app/utils/id_generator.py

import random

def generate_prefixed_id(prefix: str) -> str:
    random_suffix = f"{random.randint(0, 99999):05d}"  # Zero-padded to 5 digits
    return f"{prefix}{random_suffix}"
