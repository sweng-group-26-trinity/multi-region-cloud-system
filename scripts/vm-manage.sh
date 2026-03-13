#!/usr/bin/env bash
# Start, stop, and monitor the 6 Toast GCP VMs.
#
# Usage:
#   ./scripts/vm-manage.sh start|stop|status|cost
#   — or via Nix —
#   nix run .#vm-manage -- start|stop|status|cost
#
# Prerequisites:
#   - gcloud CLI authenticated
#   - gum installed (for formatted output)

set -euo pipefail

PROJECT="${GCP_PROJECT:-sweng-group-26}"
ZONE="${GCP_ZONE:-us-central1-c}"
VMS=(backend-a backend-b db-coordinator db-worker-1 db-worker-2 monitoring)

usage() {
  gum format <<'EOF'
Usage: vm-manage <command>

Commands:
  start   Start all VMs
  stop    Stop all VMs (saves credits - stopped VMs only pay for disk)
  status  Show current state of all VMs
  cost    Show estimated monthly cost of running VMs
EOF
  exit 1
}

start_vms() {
  gum log --level info "Starting ${#VMS[@]} VMs in $ZONE..."
  gcloud compute instances start "${VMS[@]}" \
    --zone="$ZONE" \
    --project="$PROJECT"
  gum log --level info "All VMs started"
}

stop_vms() {
  gum log --level info "Stopping ${#VMS[@]} VMs in $ZONE..."
  gcloud compute instances stop "${VMS[@]}" \
    --zone="$ZONE" \
    --project="$PROJECT"
  # shellcheck disable=SC2016
  gum log --level info 'All VMs stopped. Only disk storage charges apply (~$5/month)'
}

status_vms() {
  gcloud compute instances list \
    --filter="name:($(
      IFS=,
      echo "${VMS[*]}"
    ))" \
    --project="$PROJECT" \
    --format="table(name, zone, machineType.basename(), status, networkInterfaces[0].accessConfigs[0].natIP:label=EXTERNAL_IP)"
}

cost_estimate() {
  local running stopped
  running=$(gcloud compute instances list \
    --filter="name:($(
      IFS=,
      echo "${VMS[*]}"
    )) AND status=RUNNING" \
    --project="$PROJECT" \
    --format="value(name)" 2>/dev/null | wc -l | tr -d ' ')
  stopped=$(gcloud compute instances list \
    --filter="name:($(
      IFS=,
      echo "${VMS[*]}"
    )) AND status=TERMINATED" \
    --project="$PROJECT" \
    --format="value(name)" 2>/dev/null | wc -l | tr -d ' ')

  gum format <<EOF
Running VMs: $running
Stopped VMs: $stopped

Estimated costs (Spot instances, us-central1):
  Running 24/7:  ~\$33/month
  8hrs/day:      ~\$11/month
  Stopped:       ~\$5/month (disk only)

Tip: Run 'vm-manage stop' when you're done for the day.
EOF
}

# shellcheck disable=SC2119
case "${1:-}" in
start) start_vms ;;
stop) stop_vms ;;
status) status_vms ;;
cost) cost_estimate ;;
*) usage ;;
esac
