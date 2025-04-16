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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
