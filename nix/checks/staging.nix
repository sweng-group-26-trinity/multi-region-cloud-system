{ self, ... }:
{
  perSystem =
    { pkgs, ... }:
    {
      checks.stagingServer = pkgs.testers.runNixOSTest {
        name = "staging-server";

        nodes.staging = {
          imports = [ self.nixosModules.stagingServer ];
          networking.hostName = "staging";
        };

        testScript = ''
          staging.wait_for_unit("postgresql.service")

          staging.wait_for_unit("gcs-server.service")

          staging.wait_for_unit("backend.target")
          staging.wait_for_open_port(8080)

          staging.wait_for_unit("nginx.service")
          staging.wait_for_open_port(80)
          staging.wait_for_open_port(443)

          staging.succeed("curl -s http://localhost:8080/actuator/health | grep -o 'UP'")

          staging.succeed("curl -s -o /dev/null -w '%{http_code}' http://localhost/ | grep -E '200|301|302|307'")

          staging.succeed("ping -c 1 staging")

          print("Staging server health check passed!")
        '';
      };
    };
}
