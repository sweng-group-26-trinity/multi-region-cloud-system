#!/usr/bin/env bash
set -euo pipefail

PROJECT="${GCP_PROJECT:-sweng-group-26}"
ZONE="${GCP_ZONE:-us-central1-c}"
VMS=(backend-a backend-b db-coordinator db-worker-1 db-worker-2 monitoring)

usage() {
  cat <<EOF
Usage: $(basename "$0") <command>

Commands:
  start   Start all VMs
  stop    Stop all VMs (saves credits — stopped VMs only pay for disk)
  status  Show current state of all VMs
  cost    Show estimated monthly cost of running VMs

EOF
  exit 1
}

start_vms() {
  echo "Starting ${#VMS[@]} VMs in $ZONE..."
  gcloud compute instances start "${VMS[@]}" \
    --zone="$ZONE" \
    --project="$PROJECT"
  echo "All VMs started."
}

stop_vms() {
  echo "Stopping ${#VMS[@]} VMs in $ZONE..."
  gcloud compute instances stop "${VMS[@]}" \
    --zone="$ZONE" \
    --project="$PROJECT"
  echo "All VMs stopped. Only disk storage charges apply (~\$5/month)."
}

status_vms() {
  gcloud compute instances list \
    --filter="name:($(IFS=, ; echo "${VMS[*]}"))" \
    --project="$PROJECT" \
    --format="table(name, zone, machineType.basename(), status, networkInterfaces[0].accessConfigs[0].natIP:label=EXTERNAL_IP)"
}

cost_estimate() {
  local running stopped
  running=$(gcloud compute instances list \
    --filter="name:($(IFS=, ; echo "${VMS[*]}")) AND status=RUNNING" \
    --project="$PROJECT" \
    --format="value(name)" 2>/dev/null | wc -l | tr -d ' ')
  stopped=$(gcloud compute instances list \
    --filter="name:($(IFS=, ; echo "${VMS[*]}")) AND status=TERMINATED" \
    --project="$PROJECT" \
    --format="value(name)" 2>/dev/null | wc -l | tr -d ' ')

  echo "Running VMs: $running"
  echo "Stopped VMs: $stopped"
  echo ""
  echo "Estimated costs (Spot instances, us-central1):"
  echo "  Running 24/7:  ~\$33/month"
  echo "  8hrs/day:      ~\$11/month"
  echo "  Stopped:       ~\$5/month (disk only)"
  echo ""
  echo "Tip: Run '$(basename "$0") stop' when you're done for the day."
}

case "${1:-}" in
  start)  start_vms ;;
  stop)   stop_vms ;;
  status) status_vms ;;
  cost)   cost_estimate ;;
  *)      usage ;;
esac
