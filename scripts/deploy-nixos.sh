#!/usr/bin/env bash
# Installs NixOS on the Toast GCP VMs using nixos-anywhere, then deploys
# the full config with deploy-rs.
#
# Run this after scripts/create-vms.sh has created all the VMs.
#
# Usage:
#   ./scripts/deploy-nixos.sh
#
# Prerequisites:
#   - VMs created via create-vms.sh
#   - SSH private key matching the public key used in create-vms.sh
#   - nix available locally (nixos-anywhere is run via nix run)

set -euo pipefail

# ── Fill in the IPs printed by create-vms.sh ──────────────────────────────────
declare -A NODE_IPS=(
  [backend-a]=""
  [backend-b]=""
  [db-coordinator]=""
  [db-worker-1]=""
  [db-worker-2]=""
  [monitoring]=""
)
# ──────────────────────────────────────────────────────────────────────────────

SSH_USER="admin"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"

NODES=(backend-a backend-b db-coordinator db-worker-1 db-worker-2 monitoring)

# Verify all IPs are filled in
echo "=== Checking IPs ==="
missing=0
for name in "${NODES[@]}"; do
  ip="${NODE_IPS[$name]}"
  if [[ -z "$ip" ]]; then
    echo "  ERROR: No IP set for $name — edit the NODE_IPS section in this script"
    missing=1
  else
    echo "  $name -> $ip"
  fi
done
[[ $missing -eq 1 ]] && exit 1
echo ""

# ── Step 1: Install NixOS on each VM via nixos-anywhere ───────────────────────
# nixos-anywhere SSHes into the Debian VM, partitions the disk using our disko
# config, and installs NixOS — all in one shot.
echo "=== Step 1: Installing NixOS on all VMs ==="
echo "(This takes ~5 minutes per VM)"
echo ""

for name in "${NODES[@]}"; do
  ip="${NODE_IPS[$name]}"
  echo "--- Installing NixOS on $name ($ip) ---"

  nix run github:nix-community/nixos-anywhere -- \
    --flake ".#$name" \
    --target-host "${SSH_USER}@${ip}" \
    --ssh-option "StrictHostKeyChecking=no" \
    --ssh-option "IdentityFile=$SSH_KEY" \
    --install-via-sudo

  echo "  $name: NixOS installed, rebooting..."
  echo ""
done

# ── Step 2: Wait for all VMs to come back up ───────────────────────────────────
echo "=== Step 2: Waiting for VMs to come back up after reboot ==="

for name in "${NODES[@]}"; do
  ip="${NODE_IPS[$name]}"
  echo -n "  Waiting for $name ($ip)..."

  for _ in $(seq 1 30); do
    if ssh -o StrictHostKeyChecking=no \
           -o ConnectTimeout=5 \
           -o IdentityFile="$SSH_KEY" \
           -o BatchMode=yes \
           "admin@${ip}" true 2>/dev/null; then
      echo " ready"
      break
    fi
    echo -n "."
    sleep 10
  done
done

echo ""

# ── Step 3: Deploy full NixOS config via deploy-rs ────────────────────────────
# deploy-rs reads nix/deploy.nix and pushes the NixOS closure to each node.
# Note: deploy.nix uses hostnames — make sure your SSH config resolves them,
# or temporarily add the IPs to /etc/hosts as:
#   <ip>  backend-a
#   <ip>  backend-b
#   etc.
echo "=== Step 3: Deploying full config with deploy-rs ==="
echo ""

nix run .#deploy

echo ""
echo "=== Done ==="
echo "All nodes should now be running the full Toast NixOS configuration."
echo ""
echo "Useful commands:"
echo "  SSH in:      ssh admin@<ip>"
echo "  Re-deploy:   nix run .#deploy"
echo "  Check logs:  ssh admin@<ip> journalctl -u backend -f"
