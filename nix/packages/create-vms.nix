_: {
  perSystem =
    { pkgs, ... }:
    {
      packages.create-vms = pkgs.writeShellApplication {
        name = "create-vms";
        runtimeInputs = with pkgs; [
          gum
          google-cloud-sdk
          openssh
        ];
        text = builtins.readFile ../../scripts/create-vms.sh;
      };
    };
}
