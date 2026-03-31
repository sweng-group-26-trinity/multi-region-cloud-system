# deploy-rs configuration for deploying NixOS to our EC2 instances
{ self, inputs, ... }:
let
  # helper function to create a node config
  mkNode = hostname: {
    inherit hostname;
    profiles.system = {
      user = "root";
      path = inputs.deploy-rs.lib.x86_64-linux.activate.nixos self.nixosConfigurations.${hostname};
    };
  };
in
{
  flake.deploy = {
    # user that deploy-rs connects as
    sshUser = "admin";

    nodes = {
      backend-a = mkNode "backend-a";
      backend-b = mkNode "backend-b";
      db-coordinator = mkNode "db-coordinator";
      db-worker-1 = mkNode "db-worker-1";
      db-worker-2 = mkNode "db-worker-2";
      monitoring = mkNode "monitoring";
      ingress = mkNode "ingress";
    };
  };

  # add deploy-rs checks to make sure configs are valid
  perSystem =
    { system, ... }:
    {
      checks = inputs.deploy-rs.lib.${system}.deployChecks self.deploy;
    };
}
