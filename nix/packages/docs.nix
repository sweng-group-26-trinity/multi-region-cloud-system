{ self, ... }:
{
  perSystem =
    { pkgs, self', ... }:
    let
      docs = pkgs.stdenvNoCC.mkDerivation (finalAttrs: {
        name = "options-doc-html";
        src = self;

        nativeBuildInputs = [
          pkgs.mdbook
        ];

        dontBuild = true;
        installPhase = ''
          mkdir -p "$out/share/docs"

          mdbook build ./docs --dest-dir "$out/share/docs"

          # Rewrite mdbook's path_to_root-relative asset paths to absolute /docs/ paths.
          # mdbook renders path_to_root as "" (root pages) or "../" (subpages), producing
          # refs like href="css/..." or href="../css/...". We normalise all of them to
          # href="/docs/css/..." so they work regardless of trailing-slash on the serving URL.
          find "$out/share/docs" -name "*.html" | xargs sed -i -E \
            -e 's|href="(\.\./)*css/|href="/docs/css/|g' \
            -e 's|href="(\.\./)*fonts/|href="/docs/fonts/|g' \
            -e 's|src="(\.\./)*([a-z][^"/]*\.js)"|src="/docs/\2"|g' \
            -e 's|href="(\.\./)*([a-z][^"/]*\.css)"|href="/docs/\2"|g'

          rm "$out/share/docs/frontend" -rf
          rm "$out/share/docs/backend" -rf
          rm "$out/share/docs/openapi" -rf

          ln -sf "${self'.packages.frontend-docs}/share/docs/frontend" "$out/share/docs"
          ln -sf "${self'.packages.backend-docs}/share/docs/backend" "$out/share/docs"
          ln -sf "${self'.packages.openapi-docs}/share/docs/openapi" "$out/share/docs"
        '';

        passthru.serve = pkgs.writeShellApplication {
          name = "serve-docs";
          runtimeInputs = [ pkgs.http-server ];
          text = ''
            exec http-server "${finalAttrs.finalPackage}/share/docs"
          '';
        };
      });
    in
    {
      packages = { inherit docs; };
      checks = { inherit docs; };
    };
}
