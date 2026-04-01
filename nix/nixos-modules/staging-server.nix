{ self, lib, ... }:
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

      systemd.services.gcs-server = {
        enable = true;
        description = "Fake GCS server";
        after = [ "network.target" ];
        wantedBy = [ "multi-user.target" ];

        serviceConfig = {
          ExecStart = lib.getExe (
            pkgs.writeShellApplication {
              name = "gcs-server";
              runtimeInputs = [ pkgs.fake-gcs-server ];
              text = ''
                mkdir -p /var/lib/gcs-server/bucket
                fake-gcs-server -filesystem-root /var/lib/gcs-server/bucket
              '';
            }
          );
          DynamicUser = true;
          StateDirectory = "gcs-server";
          Restart = "always";
          RestrictRealtime = true;
          RestrictNamespaces = true;
          LockPersonality = true;
          ProtectKernelModules = true;
          ProtectKernelTunables = true;
          ProtectKernelLogs = true;
          ProtectControlGroups = true;
          ProtectClock = true;
          RestrictSUIDSGID = true;
          SystemCallArchitectures = "native";
          CapabilityBoundingSet = [ "CAP_NET_BIND_SERVICE" ];
          AmbientCapabilities = [ "CAP_NET_BIND_SERVICE" ];
          ProtectProc = "invisible";
        };
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
        "gcs-server.service"
      ];
      systemd.services.backend.requires = [
        "postgresql.service"
        "gcs-server.service"
      ];

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
