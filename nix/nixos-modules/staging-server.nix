{ self, ... }:
{
  flake.nixosModules.stagingServer =
    { pkgs, ... }:
    {
      imports = [ self.nixosModules.backend ];

      services.postgresql = {
        enable = true;
        ensureDatabases = [ "sweng" ];
        authentication = pkgs.lib.mkOverride 10 ''
          local all all trust
          host  all all 127.0.0.1/32 trust
          host  all all ::1/128      trust
        '';
      };

      services.backend = {
        enable = true;
        database = {
          name = "sweng";
          user = "postgres";
          password = "postgres";
          addr = "127.0.0.1";
          port = 5432;
        };
      };

      systemd.services.backend.after = [
        "network.target"
        "postgresql.service"
      ];
      systemd.services.backend.requires = [ "postgresql.service" ];

      services.nginx = {
        enable = true;
        recommendedProxySettings = true;
        recommendedGzipSettings = true;
        recommendedOptimisation = true;
        virtualHosts."_" = {
          default = true;
          locations."/" = {
            proxyPass = "http://127.0.0.1:8080";
            proxyWebsockets = true;
          };
        };
      };

      networking.firewall.allowedTCPPorts = [ 80 ];
    };
}
