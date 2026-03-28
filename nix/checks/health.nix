{ lib, self, ... }:
let
  sourceDir = "${self}";
  openapiSpec = "specs/openapi.yaml";
in
{
  perSystem =
    { pkgs, self', ... }:
    {
      checks.healthCheck = pkgs.testers.runNixOSTest {
        name = "health-check";
        nodes.client = {
          imports = [ self.nixosModules.backend ];
          networking.hostName = "client";
          environment.systemPackages = [
            self'.packages.schemathesis
            self'.packages.schemathesis-health-check
          ];
        };
        nodes.server = {
          imports = [ self.nixosModules.backend ];
          networking.hostName = "server";
          services.postgresql = {
            enable = true;
            ensureDatabases = [ "sweng" ];
            ensureUsers = [ ];
            authentication = pkgs.lib.mkOverride 10 ''
              local all all trust
              host all all 127.0.0.1/32 trust
              host all all ::1/128 trust
            '';
          };

          systemd.services.gcs-server = {
            enable = true;
            description = "Fake GCS server";
            after = [
              "network.target"
            ];
            wantedBy = [ "multi-user.target" ];

            serviceConfig = {
              ExecStart = lib.getExe (
                pkgs.writeShellApplication {
                  name = "gcs-server";
                  runtimeInputs = [
                    pkgs.fake-gcs-server
                  ];
                  text = ''
                    rm .gcs-server -rf

                    fake-gcs-server -filesystem-root ./.gcs-server
                  '';
                }
              );

              DynamicUser = true;

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
            };
          };
          # Ensure backend starts after PostgreSQL is ready
          systemd.services.backend.after = [
            "network.target"
            "postgresql.service"
          ];
          systemd.services.backend.requires = [ "postgresql.service" ];
          # Make server accessible to client
          networking.firewall.allowedTCPPorts = [ 8080 ];
        };
        testScript = ''
          # Wait for server's PostgreSQL to be ready
          server.wait_for_unit("postgresql.service")
          server.wait_for_unit("backend.target")
          server.wait_for_open_port(8080)

          # Verify basic health endpoint from server
          server.succeed("""
            curl http://localhost:8080/actuator/health | grep -o "UP"
          """)

          # Verify client can reach server via network
          client.wait_until_succeeds("ping -c 1 server")

          # Run schemathesis with authentication via the helper script
          client.succeed("""
            cd "${sourceDir}" && schemathesis-health-check http://server:8080/api "${openapiSpec}"
          """)

          print("Yippie Backend works!")
        '';
      };
    };
}
