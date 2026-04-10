{
  perSystem =
    { inputs', pkgs, ... }:
    let
      inherit (inputs'.bun2nix.packages) bun2nix;
      src = ../../frontend;
      pkgJson = builtins.fromJSON (builtins.readFile "${src}/package.json");
    in
    rec {
      packages.frontend = pkgs.stdenv.mkDerivation {
        pname = pkgJson.name;

        inherit src;
        inherit (pkgJson) version;

        nativeBuildInputs = [
          bun2nix.hook
        ];

        bunDeps = bun2nix.fetchBunDeps {
          bunNix = "${src}/bun.nix";
        };

        API_BASE_URL = "http://dinehubs.org/api";

        buildPhase = ''
          bun run build \
            --minify
        '';

        doCheck = true;

        installPhase = ''
          mkdir -p $out/dist

          cp -R ./dist $out
        '';
      };
      checks.frontend = packages.frontend;
    };
}
