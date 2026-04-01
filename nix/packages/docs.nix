{
  perSystem =
    { pkgs, self', ... }:
    let
      docs = pkgs.stdenvNoCC.mkDerivation (finalAttrs: {
        name = "options-doc-html";
        src = ../../docs;

        nativeBuildInputs = [
          pkgs.mdbook
        ];

        dontBuild = true;
        installPhase = ''
          mkdir -p "$out/share/docs"

          mdbook build --dest-dir "$out/share/docs"

          # Rewrite every relative URL in the mdbook HTML output to an absolute /docs/-prefixed
          # path. mdbook uses path_to_root ("" for root pages, "../" for depth-1 subpages, etc.)
          # for all asset and navigation hrefs. When the root index.html is served at /docs
          # (no trailing slash) these resolve against / instead of /docs/, breaking everything.
          #
          # Process order matters: ./ refs first, then subdir assets, then bare filenames.
          find "$out/share/docs" -name "*.html" | xargs sed -i -E \
            -e 's!(href|src)="\./!\1="/docs/!g' \
            -e 's|href="(\.\./)*css/|href="/docs/css/|g' \
            -e 's|href="(\.\./)*fonts/|href="/docs/fonts/|g' \
            -e 's!src="(\.\./)*([a-z][^"/]*\.js)"!src="/docs/\2"!g' \
            -e 's!href="(\.\./)*([a-z][^"/]*\.css)"!href="/docs/\2"!g' \
            -e 's!(href|src)="(\.\./)*([a-z0-9._-]+(/[a-z0-9._-]+)*\.html)"!\1="/docs/\3"!g' \
            -e 's!href="(\.\./)*([a-z0-9._-]+\.(svg|png|ico))"!href="/docs/\2"!g'

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
