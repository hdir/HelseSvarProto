from flask import Flask, request
from flask_cors import CORS
from dotenv import load_dotenv
import openai
import os
import json

from llama_index import (
    StorageContext, ServiceContext, OpenAIEmbedding, GPTVectorStoreIndex, 
    PromptHelper, SimpleDirectoryReader, load_index_from_storage
)
from llama_index.llms import OpenAI
from llama_index.text_splitter import SentenceSplitter

# Load environment variables from .env file
# your .env file should contain 2 keys, go into your OpenAI account, Profile (personal) and choose setting:
#OPENAI_API_KEY=<your openAI key>
#OPENAI_ORG=<your organisation key>
load_dotenv()

# Use your API key.
openai.api_key = os.getenv("OPENAI_API_KEY")
print('openAi key:', openai.api_key)

# Use your ORG key.
openai.organization = os.getenv('OPENAI_ORG')
print('ORG key:', openai.organization)

indexName = 'hvaerinnafor'

app = Flask(__name__)
CORS(app)

def create_service_context():
    llm = OpenAI(model="gpt-3.5-turbo", temperature=0, max_tokens=1000)
    embed_model = OpenAIEmbedding()
    text_splitter = SentenceSplitter(chunk_size=256, chunk_overlap=75)
    prompt_helper = PromptHelper(
        context_window=4096,
        num_output=256,
        chunk_overlap_ratio=0.7,
        chunk_size_limit=None
    )

    service_context = ServiceContext.from_defaults(
        llm=llm,
        embed_model=embed_model,
        text_splitter=text_splitter,
        prompt_helper=prompt_helper
    )
    return service_context

def data_ingestion_indexing(directory_path):
    print('Reading documents from ', './data/'+directory_path)
    documents = SimpleDirectoryReader('./data/'+directory_path).load_data()

    index = GPTVectorStoreIndex.from_documents(
        documents, service_context=create_service_context()
    )
    print('Persisting storage context for ', './storage/'+directory_path, '...')
    index.storage_context.persist(persist_dir='./storage/'+directory_path)
    return index

index = data_ingestion_indexing(indexName) # generate the index files

print('Reading storage context...')
storage_context = StorageContext.from_defaults(persist_dir='./storage/'+indexName)

print('Loading index...')
index = load_index_from_storage(storage_context, service_context=create_service_context())


@app.route('/chat', methods=['POST'])
def chat():
    print('Received data:', request.json)
    data = request.json
    messages = data.get('messages', [])

    response = index.as_query_engine().query(json.dumps(messages, ensure_ascii=False))
    print(response.response)
    return response.response

if __name__ == '__main__':
    app.run(port=80)
