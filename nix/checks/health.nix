{ self, ... }:
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
        nodes.machine = {
          imports = [
            self.nixosModules.backend
          ];
          environment.systemPackages = [
            self'.packages.schemathesis
          ];
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
        };
        testScript = ''
          machine.wait_for_unit("postgresql.service")
          machine.wait_for_unit("backend.target")
          machine.wait_for_open_port(8080)
          machine.succeed("""
            curl http://localhost:8080/actuator/health | grep -o \"UP\"
          """)

          # Property testing - cd to source dir so schemathesis.toml is auto-discovered
          # Run all test phases: examples, coverage, fuzzing, stateful
          machine.succeed("""
            cd "${sourceDir}" && schemathesis run \
              --url http://localhost:8080/api \
              "${openapiSpec}"
          """)

          print("Yippie Backend works!")
        '';
      };
    };
}
