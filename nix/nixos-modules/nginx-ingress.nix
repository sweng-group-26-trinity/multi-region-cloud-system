# nginx reverse proxy / load balancer for backend instances
_: {
  flake.nixosModules.nginxIngress =
    { config, lib, ... }:
    let
      cfg = config.services.toast-ingress;
    in
    {
      options.services.toast-ingress = {
        enable = lib.mkEnableOption "nginx reverse proxy";

        backends = lib.mkOption {
          description = "List of backend addresses to load balance across";
          type = lib.types.listOf lib.types.str;
          default = [ ];
          example = [
            "backend-a.toast.internal:8080"
            "backend-b.toast.internal:8080"
          ];
        };

        domain = lib.mkOption {
          description = "Public domain for the service";
          type = lib.types.str;
          default = "toast.app";
        };
      };

      config = lib.mkIf cfg.enable {
        services.nginx = {
          enable = true;

          # recommended defaults
          recommendedProxySettings = true;
          recommendedTlsSettings = true;
          recommendedGzipSettings = true;
          recommendedOptimisation = true;

          upstreams.backend = {
            servers = builtins.listToAttrs (
              map (addr: {
                name = addr;
                value = { };
              }) cfg.backends
            );
          };

          virtualHosts.${cfg.domain} = {
            default = true;
            enableACME = true;
            forceSSL = true;

            locations."/" = {
              proxyPass = "http://backend";
              proxyWebsockets = true;
              extraConfig = ''
                proxy_next_upstream error timeout http_502 http_503;
                proxy_connect_timeout 5s;
                proxy_read_timeout 60s;
              '';
            };

            locations."/health" = {
              proxyPass = "http://backend";
              extraConfig = ''
                access_log off;
              '';
            };
          };
        };

        networking.firewall.allowedTCPPorts = [
          80
          443
        ];
      };
    };
}
