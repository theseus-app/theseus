#!/usr/bin/env bash
# ============================================================
# Remote Provisioning Script (runs ON the GCP instance)
# ============================================================
# This script is uploaded and executed by gcp-setup.sh.
# It installs R, system dependencies, renv packages, and
# configures the Plumber API as a systemd service.
# ============================================================

set -euo pipefail

PROJECT_DIR="/opt/json2strategus-core"
SERVICE_USER="${SUDO_USER:-ubuntu}"

echo "=== System update ==="
apt update && apt upgrade -y

echo "=== Add swap (4GB) ==="
if [ ! -f /swapfile ]; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "Swap enabled"
else
  echo "Swap already exists"
fi

echo "=== Install R ==="
# Detect OS: Debian bookworm vs Ubuntu jammy
if grep -q "bookworm" /etc/os-release; then
  echo "Detected Debian 12 (bookworm)"
  apt install -y software-properties-common dirmngr gnupg2
  gpg --keyserver keyserver.ubuntu.com --recv-key '95C0FAF38DB3CCAD0C080A7BDC78B2DDEABC47B7'
  gpg --armor --export '95C0FAF38DB3CCAD0C080A7BDC78B2DDEABC47B7' | tee /etc/apt/trusted.gpg.d/cran_debian_key.asc
  echo "deb https://cloud.r-project.org/bin/linux/debian bookworm-cran40/" > /etc/apt/sources.list.d/cran.list
elif grep -q "jammy" /etc/os-release; then
  echo "Detected Ubuntu 22.04 (jammy)"
  apt install -y software-properties-common dirmngr
  wget -qO- https://cloud.r-project.org/bin/linux/ubuntu/marutter_pubkey.asc | tee /etc/apt/trusted.gpg.d/cran_ubuntu_key.asc
  add-apt-repository -y "deb https://cloud.r-project.org/bin/linux/ubuntu jammy-cran40/"
else
  echo "WARNING: Unsupported OS, attempting default R install"
fi
apt update
apt install -y r-base r-base-dev

echo "=== Install system dependencies for R packages ==="
apt install -y \
  libcurl4-openssl-dev libssl-dev libxml2-dev \
  libfontconfig1-dev libfreetype6-dev libpng-dev \
  libtiff-dev libjpeg-dev libharfbuzz-dev libfribidi-dev \
  cmake default-jdk libsodium-dev \
  libgit2-dev libssh2-1-dev

echo "=== Configure Java for R ==="
R CMD javareconf

echo "=== Restore renv packages ==="
cd "$PROJECT_DIR"
su - "$SERVICE_USER" -c "cd $PROJECT_DIR && R -e 'install.packages(\"renv\"); renv::restore(prompt = FALSE)'"

echo "=== Create systemd service ==="
cat > /etc/systemd/system/plumber.service <<EOF
[Unit]
Description=R Plumber API for json2strategus
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/Rscript $PROJECT_DIR/start_server.R
Restart=on-failure
RestartSec=5
Environment=RENV_CONFIG_AUTOLOADER_ENABLED=FALSE

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable plumber
systemctl start plumber

echo "=== Waiting for Plumber to start ==="
sleep 3

echo "=== Health check ==="
curl -s http://localhost:8787/health || echo "WARNING: Health check failed. Check: sudo journalctl -u plumber -n 50"

echo ""
echo "=== Provisioning complete ==="
