terraform {
    required_providers {
        google = {
            source = "hashicorp/google"
            version = "6.23.0"
        }
    }
}

provider "google" {
    project = "sda-vehicle-detection"
    region = "asia-southeast1"
    zone = "asia-southeast1-a"
    credentials = "./keys.json"
}