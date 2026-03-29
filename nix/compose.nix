{ inputs, lib, ... }:
{
  imports = [
    inputs.process-compose-flake.flakeModule
  ];

  perSystem =
    { pkgs, ... }:
    {
      process-compose.compose = {
        imports = [
          inputs.services-flake.processComposeModules.default
        ];

        cli.preHook = ''
          FLAKE_ROOT="$(git rev-parse --show-toplevel)"
          export FLAKE_ROOT
        '';

        settings.processes = {
          backend.command = ''
            cd "$FLAKE_ROOT/backend" &&
            ${lib.getExe pkgs.gradle_9} bootRun --rerun-tasks
          '';
          frontend.command = ''
            cd "$FLAKE_ROOT/frontend" &&
            ${lib.getExe pkgs.bun} install &&
            ${lib.getExe pkgs.bun} run dev
          '';
          gcs-server.command = ''
            cd "$FLAKE_ROOT/frontend" &&
            rm .gcs-server -rf &&
            ${lib.getExe pkgs.fake-gcs-server} -filesystem-root ./.gcs-server
          '';
        };

        services.postgres."postgres" = {
          enable = true;
          initialScript.before = ''
            CREATE USER postgres SUPERUSER PASSWORD 'postgres';
            CREATE DATABASE sweng;
          '';
        };
      };
    };
}
