{ inputs, ... }:
let
  inherit (inputs) gradle2nix;
in
{
  perSystem =
    {
      self',
      pkgs,
      system,
      ...
    }:
    let
      frontend = "${self'.packages.frontend}/dist";
    in
    rec {
      packages.backend = gradle2nix.builders.${system}.buildGradlePackage rec {
        pname = "backend";
        version = "0.1.0";

        gradle = pkgs.gradle_9-unwrapped;

        src = ../../backend;
        lockFile = "${src}/gradle.lock";

        gradleBuildFlags = [
          "test"
          "bootJar"
        ];

        nativeBuildInputs = with pkgs; [
          makeWrapper
          openjdk25
        ];

        installPhase = ''
          mkdir -p \
            "$out/share/backend" \
            "$out/bin"

          cp build/libs/backend.jar "$out/share/backend"

          makeWrapper "${pkgs.openjdk25}/bin/java" "$out/bin/${pname}" \
            --add-flags "-jar $out/share/backend/${pname}.jar"\
            --set FRONTEND_PATH "${frontend}"
        '';

        meta.mainProgram = pname;
      };
      checks.backend = packages.backend;
    };
}
