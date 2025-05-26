# Static Web App for Digital Ocean Kubernetes

This is a simple static web application that can be deployed to Digital Ocean Kubernetes using GitHub Actions.

## Project Structure

```
.
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── app.js             # JavaScript code
├── Dockerfile         # Docker configuration
├── k8s/               # Kubernetes manifests
│   └── deployment.yaml
└── .github/           # GitHub Actions workflow
    └── workflows/
        └── deploy.yml
```

## Prerequisites

1. A Digital Ocean account
2. A Digital Ocean Kubernetes cluster
3. A Docker registry (can be Digital Ocean Container Registry)
4. GitHub repository

## Required Secrets

Set up the following secrets in your GitHub repository:

- `DOCKER_REGISTRY`: Your Docker registry URL (e.g., `registry.digitalocean.com/your-registry`)
- `DOCKER_USERNAME`: Docker registry username
- `DOCKER_PASSWORD`: Docker registry password
- `DO_ACCESS_TOKEN`: Digital Ocean API token
- `CLUSTER_NAME`: Your Digital Ocean Kubernetes cluster name

## Deployment

The application will automatically deploy when you push to the `main` branch. The GitHub Actions workflow will:

1. Build the Docker image
2. Push it to your Docker registry
3. Deploy to your Digital Ocean Kubernetes cluster

## Local Development

To run the application locally:

1. Clone the repository
2. Open `index.html` in your browser

## Customization

- Modify `index.html` to change the content
- Update `styles.css` to change the appearance
- Edit `app.js` to add more interactivity
- Adjust `k8s/deployment.yaml` to modify Kubernetes configuration 