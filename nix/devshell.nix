{
  perSystem =
    { pkgs, inputs', ... }:
    {
      devShells.default = pkgs.mkShell {
        packages = with pkgs; [
          git

          gradle_9
          spring-boot-cli
          openjdk25
          graalvmPackages.graalvm-ce
          inputs'.gradle2nix.packages.gradle2nix

          bun
          inputs'.bun2nix.packages.bun2nix

          mdbook
          openapi-tui

          rage
          inputs'.ragenix.packages.ragenix
        ];

        GRAALVM_HOME = pkgs.graalvmPackages.graalvm-ce;

        shellHook = ''
          export FLAKE_ROOT="$(git rev-parse --show-toplevel)"
          export FRONTEND_PATH="$FLAKE_ROOT/frontend/dist"
        '';
      };
    };
}
