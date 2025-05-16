import os
import pandas as pd
from sentence_transformers import SentenceTransformer
import faiss
import torch
from transformers import pipeline
from PIL import Image

UPLOAD_FOLDER = "uploads"
DATA_FOLDER = "data"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)

# Load observations CSV
# def load_observations():
#     path = os.path.join(DATA_FOLDER, "observations.csv")
#     if os.path.exists(path):
#         return pd.read_csv(path)
#     return pd.DataFrame(columns=["observation_id", "species_name", "common_name", "date_observed",
#                                  "location", "image_url", "notes", "observer"])


def load_observations():
    path = os.path.join(DATA_FOLDER, "observations.csv")
    if os.path.exists(path):
        try:
            df = pd.read_csv(path)
        except pd.errors.ParserError:
            # Manually read and filter only rows with exactly 8 fields
            with open(path, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            header = lines[0].strip().split(',')
            cleaned_rows = [line for line in lines[1:] if len(line.strip().split(',')) == len(header)]
            # Reconstruct valid CSV string
            cleaned_csv = '\n'.join([lines[0].strip()] + cleaned_rows)

            from io import StringIO
            df = pd.read_csv(StringIO(cleaned_csv))
        return df
    return pd.DataFrame(columns=[
        "observation_id", "species_name", "common_name", "date_observed",
        "location", "image_url", "notes", "observer"
    ])


# Save a new observation row to CSV
def save_observation(row_dict):
    df = load_observations()
    df = pd.concat([df, pd.DataFrame([row_dict])], ignore_index=True)
    df.to_csv(os.path.join(DATA_FOLDER, "observations.csv"), index=False)

# Load knowledge base text snippets (split by double newline)
def load_knowledge_base():
    path = os.path.join(DATA_FOLDER, "knowledge_base.txt")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            content = f.read()
        return [snippet.strip() for snippet in content.split("\n\n") if snippet.strip()]
    return []

# Initialize Sentence Transformer model for embeddings (choose a small model for speed)
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# Build or update FAISS index from knowledge base + observation notes
def build_faiss_index():
    knowledge_texts = load_knowledge_base()
    df_obs = load_observations()
    notes = df_obs["notes"].dropna().astype(str).tolist()

    corpus = knowledge_texts + notes

    embeddings = embedding_model.encode(corpus, convert_to_numpy=True, show_progress_bar=False)
    dimension = embeddings.shape[1]

    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)

    return index, corpus

# Initialize global FAISS index + corpus
FAISS_INDEX, FAISS_CORPUS = build_faiss_index()

# Query similar texts for RAG
def query_similar_texts(query, top_k=5):
    global FAISS_INDEX, FAISS_CORPUS
    query_emb = embedding_model.encode([query], convert_to_numpy=True)
    distances, indices = FAISS_INDEX.search(query_emb, top_k)
    return [FAISS_CORPUS[idx] for idx in indices[0]]

# Load HuggingFace text-generation pipeline (you can change model here)
text_generator = pipeline("text2text-generation", model="google/flan-t5-small", device=0 if torch.cuda.is_available() else -1)

# Generate augmented answer using retrieved context + user query
def generate_answer(context_snippets, user_query):
    prompt = "Context: " + " ".join(context_snippets) + "\nQuestion: " + user_query + "\nAnswer:"
    response = text_generator(prompt, max_length=150, do_sample=False)
    return response[0]['generated_text']

# Save uploaded image file and return path
def save_uploaded_image(file_storage):
    filename = file_storage.filename
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    file_storage.save(save_path)
    return save_path
