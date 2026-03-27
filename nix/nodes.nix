# NixOS configurations for our GCP VMs
{ self, inputs, ... }:
let
  # helper to create a nixos system config
  mkSystem =
    modules:
    inputs.nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = modules ++ [
        self.nixosModules.base
        self.nixosModules.diskConfig
        self.nixosModules.backend
        self.nixosModules.postgres
      ];
      specialArgs = { inherit self inputs; };
    };
in
{
  flake.nixosConfigurations = {
    # backend servers
    backend-a = mkSystem [
      self.nixosModules.backendNode
      { networking.hostName = "backend-a"; }
    ];

    backend-b = mkSystem [
      self.nixosModules.backendNode
      { networking.hostName = "backend-b"; }
    ];

    # database nodes
    db-coordinator = mkSystem [
      self.nixosModules.dbCoordinator
      { networking.hostName = "db-coordinator"; }
    ];

    db-worker-1 = mkSystem [
      self.nixosModules.dbWorker
      { networking.hostName = "db-worker-1"; }
    ];

    db-worker-2 = mkSystem [
      self.nixosModules.dbWorker
      { networking.hostName = "db-worker-2"; }
    ];

    # monitoring node (no backend or postgres needed)
    monitoring = inputs.nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        self.nixosModules.base
        self.nixosModules.diskConfig
        self.nixosModules.prometheus
        self.nixosModules.grafana
        self.nixosModules.loki
        self.nixosModules.monitoringNode
        { networking.hostName = "monitoring"; }
      ];
      specialArgs = { inherit self inputs; };
    };

    docs-server = inputs.nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        inputs.garnix-lib.nixosModules.garnix
        {
          garnix.server.enable = true;
        }
        self.nixosModules.docsServer
      ];
    };
  };
}
