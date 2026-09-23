
resource "google_service_account" "default" {
    account_id   = "dtect-web-sa"
    display_name = "Custom SA for DTECT Web"
}

resource "google_compute_firewall" "allow_http_https_instance" {
    name    = "allow-http-https-instance"
    network = "default"

    allow {
        protocol = "tcp"
        ports    = ["80", "443"]
    }

    source_ranges = ["0.0.0.0/0"]
    target_service_accounts = [google_service_account.default.email]
}

resource "google_compute_firewall" "allow_lb_instance" {
    name    = "allow-loadbalancer-instance"
    network = "default"

    allow {
        protocol = "tcp"
        ports    = ["80", "443"]
    }

    source_ranges = ["130.211.0.0/22", "35.191.0.0/16"]
    target_service_accounts = [google_service_account.default.email]
}

resource "google_compute_instance" "frontend-yolo-detection" {
    name             = "frontend-yolo-detection"
    zone             = "asia-southeast1-a"
    machine_type     = "n2d-standard-2"
    min_cpu_platform = "AMD Milan"

    confidential_instance_config {
        enable_confidential_compute = true
        confidential_instance_type  = "SEV"
    }

    boot_disk {
        initialize_params {
            image = "ubuntu-os-cloud/ubuntu-2004-lts"
            labels = {
                my_label = "value"
            }
            size = 25
        }
    }

    network_interface {
        network = "default"

        access_config {
        }
    }

    tags = ["web-server"]

    service_account {
        email  = google_service_account.default.email
        scopes = ["cloud-platform"]
    }
}
