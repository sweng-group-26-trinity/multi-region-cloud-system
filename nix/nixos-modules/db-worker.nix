# Citus worker node configuration
{
  flake.nixosModules.dbWorker = {
    services.postgres-distributed = {
      enable = true;
      enableSecrets = false;
      isCoordinator = false;
      coordinatorAddress = "db-coordinator.toast.internal";
    };
  };
}
