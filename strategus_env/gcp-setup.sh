#!/usr/bin/env bash
# ============================================================
# GCP R Plumber Server Setup Script
# ============================================================
# Run this script from your LOCAL machine (macOS) to:
#   1. Create a GCP Compute Engine instance
#   2. Open firewall for port 8787
#   3. Upload renv files
#   4. Run the remote provisioning script
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - Working directory: json2strategus-core/
#
# Usage:
#   cd json2strategus-core && bash gcp-setup.sh
# ============================================================

set -euo pipefail

INSTANCE_NAME="r-plumber"
ZONE="us-central1-a"
MACHINE_TYPE="e2-small"
PROJECT_DIR="/opt/json2strategus-core"

echo "=== Step 1: Create GCP Compute Engine instance ==="
gcloud compute instances create "$INSTANCE_NAME" \
  --machine-type="$MACHINE_TYPE" \
  --zone="$ZONE" \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --tags=plumber-server || echo "Instance may already exist, continuing..."

echo ""
echo "=== Step 2: Create firewall rule for port 8787 ==="
gcloud compute firewall-rules create allow-plumber \
  --allow=tcp:8787 \
  --target-tags=plumber-server \
  --source-ranges=0.0.0.0/0 \
  --description="Allow Plumber API access" 2>/dev/null || echo "Firewall rule may already exist, continuing..."

echo ""
echo "=== Step 3: Upload renv files to instance ==="

# Wait for instance to be ready
echo "Waiting for SSH to become available..."
for i in {1..30}; do
  if gcloud compute ssh "$INSTANCE_NAME" --zone="$ZONE" --command="echo ok" 2>/dev/null; then
    break
  fi
  echo "  Waiting... ($i/30)"
  sleep 5
done

# Create remote directory
gcloud compute ssh "$INSTANCE_NAME" --zone="$ZONE" --command="sudo mkdir -p $PROJECT_DIR && sudo chown \$(whoami):\$(whoami) $PROJECT_DIR"

# Upload renv configuration files
gcloud compute scp \
  renv.lock \
  .Rprofile \
  .renvignore \
  plumber.R \
  start_server.R \
  "$INSTANCE_NAME:$PROJECT_DIR/" \
  --zone="$ZONE"

# Upload renv bootstrap files
gcloud compute ssh "$INSTANCE_NAME" --zone="$ZONE" --command="mkdir -p $PROJECT_DIR/renv"
gcloud compute scp \
  renv/activate.R \
  renv/settings.json \
  "$INSTANCE_NAME:$PROJECT_DIR/renv/" \
  --zone="$ZONE"

echo ""
echo "=== Step 4: Run remote provisioning ==="

# Upload and execute the remote setup script
gcloud compute scp gcp-remote-provision.sh "$INSTANCE_NAME:/tmp/provision.sh" --zone="$ZONE"
gcloud compute ssh "$INSTANCE_NAME" --zone="$ZONE" --command="chmod +x /tmp/provision.sh && sudo /tmp/provision.sh"

echo ""
echo "=== Step 5: Get external IP ==="
EXTERNAL_IP=$(gcloud compute instances describe "$INSTANCE_NAME" --zone="$ZONE" --format='get(networkInterfaces[0].accessConfigs[0].natIP)')
echo ""
echo "============================================"
echo "  Setup complete!"
echo "  External IP: $EXTERNAL_IP"
echo "  Health check: curl http://$EXTERNAL_IP:8787/health"
echo ""
echo "  Update your theseus .env:"
echo "  R_PLUMBER_URL=http://$EXTERNAL_IP:8787"
echo "============================================"
