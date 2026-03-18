# Base configuration shared by all nodes
_: {
  flake.nixosModules.base =
    { modulesPath, inputs, ... }:
    {
      imports = [
        "${modulesPath}/virtualisation/google-compute-image.nix"
        inputs.ragenix.nixosModules.default
        inputs.disko.nixosModules.disko
      ];

      # allow ssh access for deployments
      services.openssh.enable = true;

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
        trusted-users = [ "root" ];
      };

      system.stateVersion = "25.11";
    };
}
