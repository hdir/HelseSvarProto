# Llama Index Server Application

This server application is developed using Flask and integrates OpenAI's GPT-3.5 for natural language processing. 
It utilizes the Llama Index library for managing vector storage and retrieval, offering an interface for chat-like interactions.
For the client application, please refer to the 'React Native ChatGPT Client Application' section
This application serves as a demonstrative example to test the capabilities of Retrieval-Augmented Generation (RAG) using Llama Index and OpenAI. 
It has been developed by HELSEDIREKTORATET (the Norwegian Directorate of Health) as part of the 'HelseSvar' project.

## Features

- Utilizes OpenAI's GPT-3.5 model for advanced language understanding.
- Stores and retrieves text data using the Llama Index library.
- Allows querying of stored data with a natural language interface.
- Supports context-aware responses based on the indexed data.
- it uses the  Llama-index==0.10.12 (from 22.01.2024), and openai==1.12.0

## Setup

Before running the application, ensure you have Python installed along with Flask and other required libraries.

### Installation

1. Clone the repository to your local machine.
2. Install required Python packages:

    ```bash
    pip install -r requirements.txt

### Configuratiom

1. Create a .env file in the root directory of the project with the following content (replace the placeholders with your actual API keys):
OPENAI_API_KEY=your_openai_api_key
OPENAI_ORG=your_openai_organization_key

2. Data Indexing
The application requires indexed data to function correctly. Data indexing is done using the download_and_persist_storage function:
Specify the data source directory and the storage directory for indexing.
The application currently indexes data from ./data/titanic into ./storage/titanic.

## Running the Server

To start the server, run "server_simple.py" in a python console:
The server will start on http://localhost:80.

## Usage
Refer to the section 'React Native ChatGPT Client Application'


# React Native ChatGPT Client Application

This is a React Native client application designed to interact with a server running OpenAI's GPT-3.5 model. 
It provides a user-friendly interface for sending queries and receiving responses, leveraging the Llama Index library for vector storage and retrieval.

## Features

- Chat interface to interact with OpenAI's GPT-3.5 model.
- Real-time display of chat messages with a scrolling view.
- Ability to clear chat history and input field.
- Toggle to show or hide the context used by the AI for generating responses.

## Setup and Installation

Ensure you have React Native set up in your development environment. For detailed instructions, visit [React Native Environment Setup](https://reactnative.dev/docs/environment-setup).

### Cloning the Repository

1. Clone this repository to your local machine:
    ```bash
    git clone <repository-url>

2. Installing Dependencies
    Navigate to the project directory and install the required dependencies:
    cd src<project-directory>
    npm install

### Running the Application
    To start the application, run the following command in the "src"" directory:
    cd src
    npm start

    The application stars in you default web browser

### Usage
    Enter your query in the text input field.
    Press 'Send' to submit the query to the server.
    The response from the server will be displayed in the chat window.
    Toggle the 'Show Context' checkbox to see the context used for generating response
    Press 'Slett' to clear the output window

