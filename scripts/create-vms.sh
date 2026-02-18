#!/usr/bin/env bash
# Creates all 6 Toast GCP VMs with Debian 12.
# After running this, run scripts/deploy-nixos.sh to install NixOS on them.
#
# Usage:
#   GCP_PROJECT=my-project ./scripts/create-vms.sh
#
# Prerequisites:
#   - gcloud CLI authenticated: gcloud auth login
#   - Project set or passed via GCP_PROJECT env var

set -euo pipefail

# ── Config — edit these ────────────────────────────────────────────────────────
GCP_PROJECT="${GCP_PROJECT:-}"
SSH_PUB_KEY="${SSH_PUB_KEY:-$HOME/.ssh/id_ed25519.pub}"
DISK_SIZE="20GB"
MACHINE_TYPE="e2-medium"   # 2 vCPU, 4 GB — enough for a demo
IMAGE_FAMILY="debian-12"
IMAGE_PROJECT="debian-cloud"
NETWORK_TAG="toast-node"
# ──────────────────────────────────────────────────────────────────────────────

if [[ -z "$GCP_PROJECT" ]]; then
  echo "Error: set GCP_PROJECT env var to your GCP project ID"
  echo "  e.g. GCP_PROJECT=my-project-123 ./scripts/create-vms.sh"
  exit 1
fi

if [[ ! -f "$SSH_PUB_KEY" ]]; then
  echo "Error: SSH public key not found at $SSH_PUB_KEY"
  echo "  Set SSH_PUB_KEY env var to your public key path"
  exit 1
fi

# Node definitions: "name  zone"
# Two regions for the multi-region story:
#   us-central1    → backend-a, db-coordinator, db-worker-1, monitoring
#   europe-west1   → backend-b, db-worker-2
declare -A NODE_ZONES=(
  [backend-a]="us-central1-a"
  [backend-b]="europe-west1-b"
  [db-coordinator]="us-central1-a"
  [db-worker-1]="us-central1-a"
  [db-worker-2]="europe-west1-b"
  [monitoring]="us-central1-a"
)

NODES=(backend-a backend-b db-coordinator db-worker-1 db-worker-2 monitoring)

# Wrap gcloud to always pass --project
gcloud() { command gcloud --project "$GCP_PROJECT" "$@"; }

echo "=== Toast VM Setup ==="
echo "Project : $GCP_PROJECT"
echo "SSH key : $SSH_PUB_KEY"
echo ""

# ── Firewall rules ─────────────────────────────────────────────────────────────
echo "Setting up firewall rules..."

gcloud compute firewall-rules create toast-allow-ssh \
  --network default \
  --allow tcp:22 \
  --target-tags "$NETWORK_TAG" \
  --description "Toast: SSH access" 2>/dev/null \
  && echo "  Created: toast-allow-ssh" \
  || echo "  Already exists: toast-allow-ssh"

gcloud compute firewall-rules create toast-allow-tailscale \
  --network default \
  --allow udp:41641 \
  --target-tags "$NETWORK_TAG" \
  --description "Toast: Tailscale WireGuard" 2>/dev/null \
  && echo "  Created: toast-allow-tailscale" \
  || echo "  Already exists: toast-allow-tailscale"

gcloud compute firewall-rules create toast-allow-internal \
  --network default \
  --allow tcp,udp,icmp \
  --source-tags "$NETWORK_TAG" \
  --target-tags "$NETWORK_TAG" \
  --description "Toast: unrestricted inter-node traffic" 2>/dev/null \
  && echo "  Created: toast-allow-internal" \
  || echo "  Already exists: toast-allow-internal"

echo ""

# ── Create VMs ─────────────────────────────────────────────────────────────────
echo "Creating VMs..."
SSH_METADATA="admin:$(cat "$SSH_PUB_KEY")"

for name in "${NODES[@]}"; do
  zone="${NODE_ZONES[$name]}"
  echo "  $name  ($zone, $MACHINE_TYPE)..."

  if gcloud compute instances describe "$name" --zone "$zone" &>/dev/null; then
    echo "    Already exists — skipping"
    continue
  fi

  gcloud compute instances create "$name" \
    --zone "$zone" \
    --machine-type "$MACHINE_TYPE" \
    --image-family "$IMAGE_FAMILY" \
    --image-project "$IMAGE_PROJECT" \
    --boot-disk-size "$DISK_SIZE" \
    --boot-disk-type "pd-ssd" \
    --tags "$NETWORK_TAG" \
    --metadata "ssh-keys=$SSH_METADATA" \
    --quiet

  echo "    Done"
done

echo ""

# ── Print IPs ──────────────────────────────────────────────────────────────────
echo "=== VM External IPs ==="
echo "(Copy these into deploy-nixos.sh)"
echo ""

for name in "${NODES[@]}"; do
  zone="${NODE_ZONES[$name]}"
  ip=$(gcloud compute instances describe "$name" \
    --zone "$zone" \
    --format="get(networkInterfaces[0].accessConfigs[0].natIP)" 2>/dev/null || echo "unknown")
  printf "  %-20s %s\n" "$name" "$ip"
done

echo ""
echo "Next step: run  scripts/deploy-nixos.sh  to install NixOS on each VM"
