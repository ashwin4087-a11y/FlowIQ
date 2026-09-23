# Makefile for Docker image operations

# Variables
tag?=v1.3
IMAGE_NAME = express-server:$(tag)
DOCKERFILE_PATH = docker\Dockerfile
REGISTRY = alivefordie

# Default target
all: build push

# Build the Docker image
build:
	npm run build
	docker build -t $(IMAGE_NAME) -f $(DOCKERFILE_PATH) .

# Push the Docker image
push:
	docker tag $(IMAGE_NAME) $(REGISTRY)/$(IMAGE_NAME)
	docker push $(REGISTRY)/$(IMAGE_NAME)

# Clean up Docker images
clean:
	docker rmi $(IMAGE_NAME)


.PHONY: all build push clean
