from flask import Flask, request, Response
from flask_cors import CORS
from dotenv import load_dotenv
import openai
import os
import json
import llama_index.core.readers as readers
from llama_index.core import Settings, StorageContext, VectorStoreIndex, load_index_from_storage, get_response_synthesizer
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.postprocessor import SimilarityPostprocessor

# Load environment variables
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
openai.organization = os.getenv("OPENAI_ORG")

def download_and_persist_storage(name, storage):
    print('1 - download_and_persist_storage')
    documents = readers.SimpleDirectoryReader(input_dir=name).load_data()
    print(f'2 - Loaded {len(documents)} documents')

    nodes = Settings.text_splitter.get_nodes_from_documents(documents)
    print('3 - SentenceSplitter ok')
    print(f'4 - Loaded {len(nodes)} nodes')

    storage_context = StorageContext.from_defaults()
    print('5 - StorageContext.from_defaults ok')

    index = VectorStoreIndex(nodes, storage_context=storage_context)
    print('6 - VectorStoreIndex created in memory')

    storage_context.persist(persist_dir=storage)
    print('7 - storage_context.persist ok')

    return index

# Flask app configuration
app = Flask(__name__)
CORS(app)

# Llama Index Settings
Settings.text_splitter = SentenceSplitter.from_defaults(chunk_size=512, chunk_overlap=154)
Settings.context_window = 6000
Settings.num_output = 2000
Settings.chunk_size = 512
Settings.llm = OpenAI(model="gpt-3.5-turbo", temperature=0, max_tokens=1000)
Settings.embed_model = OpenAIEmbedding()

# Build and store index
index = download_and_persist_storage('./data/titanic', './storage/titanic')

# Read index
print('Reading storage context...')
storage_context = StorageContext.from_defaults(persist_dir='./storage/titanic')

print('Loading index...')
load_index_from_storage(storage_context)

# Configure retriever and query engine
retriever = VectorIndexRetriever(index=index, similarity_top_k=20)
response_synthesizer = get_response_synthesizer(response_mode='tree_summarize', streaming=True, structured_answer_filtering=True)
query_engine = RetrieverQueryEngine(retriever=retriever, response_synthesizer=response_synthesizer, node_postprocessors=[SimilarityPostprocessor(similarity_cutoff=0.7)])

@app.route('/chat', methods=['POST'])
def chat():
    print('Received data:', request.json)
    data = request.json
    messages = data.get('messages', [])
    showContext_fromRequest = data.get('showContext', False)
    answer = query_engine.query(json.dumps(messages, ensure_ascii=False))

    def generate_response():
        try:
            for text in answer.response_gen:
                text = text.replace('\\n', '\n').replace('\\"', '"')
                yield text
                
            if showContext_fromRequest : 
                yield f"\n\nFølgende {len(answer.source_nodes)} tekster er brukt:"
                for node in list(answer.source_nodes):
                    yield f'\nMetadata: {node.metadata}\nNode: {node}\n-------'    

        except AttributeError:
            pass

    return Response(generate_response(), content_type="application/json; charset=utf-8")

if __name__ == '__main__':
    app.run(port=80)
