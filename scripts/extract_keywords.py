import sys
import json
import os
import docx
import nltk
import PyPDF2
import csv
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.tag import pos_tag
from bloom_filter2 import BloomFilter

# Download required NLTK resources
nltk.download("punkt")
nltk.download("stopwords")
nltk.download("averaged_perceptron_tagger")


def extract_text_from_docx(docx_path):
    """Extract text from a DOCX file."""
    try:
        doc = docx.Document(docx_path)
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        return f"Error: {str(e)}"


def extract_text_from_pdf(pdf_path):
    """Extract text from a PDF file."""
    try:
        text = ""
        with open(pdf_path, "rb") as pdf_file:
            reader = PyPDF2.PdfReader(pdf_file)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        return f"Error: {str(e)}"


def extract_text_from_txt(txt_path):
    """Extract text from a TXT file."""
    try:
        with open(txt_path, "r", encoding="utf-8") as file:
            return file.read()
    except Exception as e:
        return f"Error: {str(e)}"


def extract_text_from_csv(csv_path):
    """Extract text from a CSV file."""
    try:
        text = []
        with open(csv_path, "r", encoding="utf-8") as file:
            reader = csv.reader(file)
            for row in reader:
                text.append(" ".join(row))
        return "\n".join(text)
    except Exception as e:
        return f"Error: {str(e)}"


def extract_text(file_path):
    """Determine file type and extract text accordingly."""
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".docx":
        return extract_text_from_docx(file_path)
    elif ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".txt":
        return extract_text_from_txt(file_path)
    elif ext == ".csv":
        return extract_text_from_csv(file_path)
    else:
        return f"Error: Unsupported file format ({ext})"


def extract_keywords(text):
    """Extract important keywords (nouns, proper nouns) while removing stopwords."""
    words = word_tokenize(text)
    words = [word.lower() for word in words if word.isalnum()]  # Remove punctuation

    stop_words = set(stopwords.words("english"))
    filtered_words = [
        word for word in words if word not in stop_words
    ]  # Remove stopwords

    # Keep only nouns and proper nouns
    tagged_words = pos_tag(filtered_words)
    keywords = [
        word for word, tag in tagged_words if tag in ("NN", "NNS", "NNP", "NNPS")
    ]

    return keywords


def main():
    """Main function to extract keywords dynamically from any file type."""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        return

    file_path = sys.argv[1]

    # Extract text from the file
    text = extract_text(file_path)

    if text.startswith("Error:"):
        print(json.dumps({"error": text}))
        return

    # Extract refined keywords
    keywords = extract_keywords(text)

    # Bloom Filter Setup
    bloom = BloomFilter(max_elements=10, error_rate=0.01)
    for keyword in keywords:
        bloom.add(keyword)

    # Convert bloom filter to a serializable format
    # bloom_filter_data = [word for word in keywords if word in bloom]
    bloom_filter_data = keywords

    # Return extracted keywords and bloom filter
    print(json.dumps({"keywords": keywords, "bloom_filter": bloom_filter_data}))


if __name__ == "__main__":
    main()
