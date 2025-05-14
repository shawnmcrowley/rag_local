# Local LLM Development with Regenerative AI

This is a [Next.js](https://nextjs.org) Progressive Web Application (PWA) that provides a responsive form interface with Snowflake integration.

## Features

- Responsive form interface with drag-and-drop functionality
- Snowflake Arctic Embeddings integration
- Results visualization and metadata display
- Docker-based deployment for Ollama and WebUI
- Configurable settings for Snowflake integration

## Project Structure

```
/
├── public/             # Static assets and documents
├── src/
│   ├── app/            # Next.js app router components
│   ├── components/     # Reusable UI components
│   └── utils/          # Utility functions
├── scripts/            # Helper scripts
├── embeddings/         # Generated embeddings storage
└── uploads/            # Uploaded file storage
```

## Getting Started

First, start the containers for Ollama and WebUI:

```bash
docker-compose up -d
```

Second, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Using the Application

1. Upload files using drag-and-drop or file selector
2. Configure settings (chunk size, overlap, model)
3. Submit the form to process with Snowflake
4. View results and metadata in the results table

## Docker Commands for Ollama

####  Access the Shell

    docker exec -it ollama /bin/bash

####  Pull Models

    ollama pull <model_name>

####  Copy Files from Host to Ollama Container

    docker compose cp /usr/local/share/ca-certificates/*  ollama:/usr/local/share/ca-certificates/

####  How to Update Certificates for Ollama Registry Access Behind Access Control

This is how you fix it.

Run this command to list the root certs currently installed on your machine.

    sudo update-ca-certificates --fresh 

Download Zscaler's root cert in der format and convert it to pem (but make sure the extension is .crt. Otherwise it won't work)

    cp <file>.crt /usr/local/share/ca-certificates

Run this commad again

    sudo update-ca-certificates --fresh

It will read the crt file and add it to the available root cert store on your linux machine.
Try docker pull hello-world again.

It will go to docker site and download its cert.
Since docker site cert was signed by Zscaler, your computer will check the matching root cert of zscaler.
Since your computer now has the file, it will validate the cert (that was signed by Zscaler) is legit and proceed without any errors.

#### Connect to Web UI to validate models and Test

Open [http://localhost:8080](http://localhost:8080) with your browser to see the WebUI.

#### Updating to the Latest Ollama Version

This is a sample, but, find and back up your Models Data in your Docker Volumes

    $ sudo docker inspect ollama | grep -i volume
            "VolumeDriver": "",
            "VolumesFrom": null,
                "Type": "volume",
                "Source": "/mnt/scratch/docker/volumes/ollama/_data",
            "Volumes": null,

#### Copy Models:

    $ sudo bash
    $ cd /mnt/scratch
    $ cp -al docker/volumes/ollama/_data ollama_backup

#### Remove your Container:

    sudo docker rm ollama

#### Re-run Docker Compose to pull the latest image

    docker-compose up -d

#### List Your Local Models and Remove Models

    > ollama list
    NAME                           	ID          	SIZE  	MODIFIED     
    codegemma:7b-code-fp16         	211627025485	17 GB 	2 days ago  	
    codegemma:7b-instruct-fp16     	27f776c137a0	17 GB 	2 days ago  	
    codellama:70b-code-q2_K        	a971fcfd33e2	25 GB 	2 days ago  	
    codellama:latest               	8fdf8f752f6e	3.8 GB	10 days ago 	
    command-r:latest               	b8cdfff0263c	20 GB 	4 weeks ago 

    > ollama rm codellama
    deleted 'codellama'
    > ollama rm codellama:70b-code-q2_K 
    deleted 'codellama:70b-code-q2_K'

## Technologies Used

- Next.js 15.3.0
- React 19.0.0
- TailwindCSS for styling
- Snowflake Arctic Embeddings
- Docker for containerization

## Requirements

- Node.js 18+ 
- Docker and Docker Compose
- Ollama with the `snowflake-artic-embed2` model installed