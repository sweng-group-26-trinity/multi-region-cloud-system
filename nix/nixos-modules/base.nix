# Base configuration shared by all nodes
_: {
  flake.nixosModules.base =
    {
      modulesPath,
      inputs,
      lib,
      ...
    }:
    {
      imports = [
        "${modulesPath}/virtualisation/google-compute-image.nix"
        inputs.ragenix.nixosModules.default
        inputs.disko.nixosModules.disko
      ];

      # allow ssh access for deployments
      services.openssh.enable = true;

      # admin user for SSH access and deployments
      users.users.admin = {
        isNormalUser = true;
        createHome = true;
        openssh.authorizedKeys.keys = [
          "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAMeaoHb1PbGrDkhYduSLkFm+oM30W/8r0U5qbz/XxQy joshid@tcd.ie"
        ];
        extraGroups = [ "wheel" ];
      };

      # allow wheel (admin) to sudo without password — required for deploy-rs
      security.sudo.wheelNeedsPassword = false;

      # disable GCP OS Login — we use our own admin user with SSH keys
      security.googleOsLogin.enable = lib.mkForce false;

      # static hosts for toast.internal — replaces Tailscale MagicDNS for now
      networking.hosts = {
        "10.128.0.13" = [
          "backend-a.toast.internal"
          "backend-a"
        ];
        "10.128.0.6" = [
          "backend-b.toast.internal"
          "backend-b"
        ];
        "10.128.0.3" = [
          "db-coordinator.toast.internal"
          "db-coordinator"
        ];
        "10.128.0.4" = [
          "db-worker-1.toast.internal"
          "db-worker-1"
        ];
        "10.128.0.7" = [
          "db-worker-2.toast.internal"
          "db-worker-2"
        ];
        "10.128.0.5" = [
          "monitoring.toast.internal"
          "monitoring"
        ];
        "10.128.0.8" = [
          "ingress.toast.internal"
          "ingress"
        ];
      };

      # use nftables instead of iptables (faster and more secure)
      networking.nftables.enable = true;

      # basic firewall - tailscale will handle internal networking
      networking.firewall = {
        enable = true;
        allowedUDPPorts = [ 41641 ]; # tailscale
      };

      # nix settings
      nix.settings = {
        experimental-features = [
          "nix-command"
          "flakes"
        ];
        trusted-users = [
          "root"
          "admin"
        ];
        # allow deploy-rs to copy locally-built paths without public cache signatures
        require-sigs = false;
        substituters = [
          "https://cache.nixos.org"
          "https://cache.garnix.io"
        ];
        trusted-public-keys = [
          "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
          "cache.garnix.io:CTFPyKSLcx5RMJKfLo5EEPUObbA78b0YQ2DTCJXqr9g="
        ];
      };

      system.stateVersion = "25.11";
    };
}
