This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, start the containers for Ollama and WebUI:

```bash
docker-compose up -d
```

Second, run the development server:

```bash
npm run dev

```
## Docker Commands for Ollama

####  Access the Shell

    docker exec -it ollama /bin/bash

####  Pull Models

    ollama pull <model_name>

####  Copy Files from Host to Ollama Container

    docker compose cp /usr/local/share/ca-certificates/*  ollama:/usr/local/share/ca-certificates/

Open [http://localhost:8080](http://localhost:8080) with your browser to see the WebUI.

#### Updating to the Latest Ollama Version

This is a sample, but, find and back up your Models Data in your Docker Volumes

    $ sudo docker inspect ollama | grep -i volume
            "VolumeDriver": "",
            "VolumesFrom": null,
                "Type": "volume",
                "Source": "/mnt/scratch/docker/volumes/ollama/_data",
            "Volumes": null,

Copy Models:

    $ sudo bash
    $ cd /mnt/scratch
    $ cp -al docker/volumes/ollama/_data ollama_backup

Remove your Container:

    sudo docker rm ollama

Re-run Docker Compose to pull the latest image

