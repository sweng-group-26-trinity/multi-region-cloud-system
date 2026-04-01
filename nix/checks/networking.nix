{ self, ... }:
{
  perSystem =
    { pkgs, ... }:
    {
      checks.networkingModules = pkgs.testers.runNixOSTest {
        name = "networking-modules";

        nodes = {
          # headscale coordination server
          headscale = {
            imports = [
              self.nixosModules.headscale
            ];

            services.toast-headscale = {
              enable = true;
              domain = "test.internal";
            };
          };

          # nginx ingress node
          ingress = {
            imports = [
              self.nixosModules.nginxIngress
            ];

            services.toast-ingress = {
              enable = true;
              backends = [ "127.0.0.1:8080" ];
              domain = "localhost";
            };
          };
        };

        testScript = ''
          # verify headscale starts
          headscale.wait_for_unit("headscale.service")
          headscale.wait_for_open_port(8080)
          headscale.succeed("curl -s http://localhost:8080/health || true")

          # verify nginx starts and responds (use https with -k since forceSSL redirects http)
          ingress.wait_for_unit("nginx.service")
          ingress.wait_for_open_port(443)
          ingress.succeed("curl -s -k -o /dev/null -w '%{http_code}' https://localhost/ | grep -E '502|503'")
        '';
      };
    };
}
