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
      docs = "${self'.packages.docs}/share/docs";

      metadataVersion = "0.3.30";

      metadata = pkgs.fetchurl {
        url = "https://github.com/oracle/graalvm-reachability-metadata/releases/download/${metadataVersion}/graalvm-reachability-metadata-${metadataVersion}.zip";
        hash = "sha256-DKG5ny/W++SO6hXsR5ySY8h0t8TDZqnnKa7HqSKnMEg=";
      };
    in
    rec {
      packages.backend = gradle2nix.builders.${system}.buildGradlePackage rec {
        pname = "backend";
        version = "0.1.0";

        gradle = pkgs.gradle_9-unwrapped;

        src = ../../backend;
        lockFile = "${src}/gradle.lock";

        gradleBuildFlags = [
          "bootJar"
        ];

        nativeBuildInputs = with pkgs; [
          makeWrapper
          graalvmPackages.graalvm-ce
        ];

        preBuild = ''
          sed -i '
          /^[[:space:]]*metadataRepository[[:space:]]*{.*}$/{
            c\
            metadataRepository {\
                uri(file("${metadata}"))\
                enabled.set(true)\
            }
          }
          ' build.gradle.kts
        '';

        installPhase = ''
          mkdir -p "$out/bin"

          cp build/native/nativeCompile/${pname} "$out/bin/${pname}"

          wrapProgram "$out/bin/${pname}" \
            --set FRONTEND_PATH "${frontend}" \
            --set DOCUMENTATION_PATH "${docs}"
        '';

        meta.mainProgram = pname;
      };
      packages.default = packages.backend;
      checks.backend = packages.backend;
    };
}
