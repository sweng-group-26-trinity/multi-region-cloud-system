# Citus coordinator node configuration
{
  flake.nixosModules.dbCoordinator = {
    services.postgres-distributed = {
      enable = true;
      enableSecrets = false;
      isCoordinator = true;
      coordinatorAddress = "db-coordinator.toast.internal";
      workerNodes = [
        "db-worker-1.toast.internal"
        "db-worker-2.toast.internal"
      ];
    };
  };
}
