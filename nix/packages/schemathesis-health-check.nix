_: {
  perSystem =
    { pkgs, self', ... }:
    {
      packages.schemathesis-health-check = pkgs.writeShellApplication {
        name = "schemathesis-health-check";
        runtimeInputs = with pkgs; [
          curl
          gum
          jq
          self'.packages.schemathesis
        ];
        text = builtins.readFile ../../scripts/run-schemathesis.sh;
      };
    };
}
