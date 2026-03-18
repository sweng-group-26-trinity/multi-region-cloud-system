_: {
  perSystem =
    { pkgs, ... }:
    {
      packages.vm-manage = pkgs.writeShellApplication {
        name = "vm-manage";
        runtimeInputs = with pkgs; [
          gum
          google-cloud-sdk
        ];
        text = builtins.readFile ../../scripts/vm-manage.sh;
      };
    };
}
