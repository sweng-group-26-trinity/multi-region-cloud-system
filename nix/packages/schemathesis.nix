{ inputs, ... }:
{
  perSystem =
    { pkgs, ... }:
    let
      python = pkgs.python312;
      pythonPackages = python.pkgs;

      harfile = pythonPackages.buildPythonPackage rec {
        pname = "harfile";
        version = "0.4.0";
        pyproject = true;

        src = pkgs.fetchPypi {
          inherit pname version;
          hash = "sha256-NOLZ7zQQHXaVZr/6s8Qg4Ud3YXQwi+0aA27Y22AMq94=";
        };

        build-system = [ pythonPackages.hatchling ];

        pythonImportsCheck = [ "harfile" ];
      };

      hypothesis-graphql = pythonPackages.buildPythonPackage {
        pname = "hypothesis_graphql";
        version = "0.12.0";
        format = "wheel";

        src = pkgs.fetchurl {
          url = "https://files.pythonhosted.org/packages/92/9c/e6baef1c1188d2d12dcd2b344a166cbe5b220db215c6177bedcf0fa8cac7/hypothesis_graphql-0.12.0-py3-none-any.whl";
          hash = "sha256-0gDT1DIOdyJIB18Txlb0sd4B5/D159n9b+p9p1mzJfM=";
        };

        dependencies = with pythonPackages; [
          hypothesis
          graphql-core
        ];

        pythonImportsCheck = [ "hypothesis_graphql" ];
      };

      hypothesis-jsonschema = pythonPackages.buildPythonPackage rec {
        pname = "hypothesis-jsonschema";
        version = "0.23.1";
        pyproject = true;

        src = pkgs.fetchPypi {
          inherit pname version;
          hash = "sha256-9KwDICQ0KkFJoQJTmE9aVza4Kz/ir7CIjzg0oxFT8hU=";
        };

        build-system = [ pythonPackages.setuptools ];

        dependencies = with pythonPackages; [
          hypothesis
          jsonschema
        ];

        pythonImportsCheck = [ "hypothesis_jsonschema" ];
      };

      starlette-testclient = pythonPackages.buildPythonPackage rec {
        pname = "starlette_testclient";
        version = "0.4.1";
        pyproject = true;

        src = pkgs.fetchPypi {
          inherit pname version;
          hash = "sha256-npk//hL6tFYGEWJXgTmGYSJi/hXBu23J45zGhpOsH8U=";
        };

        build-system = [ pythonPackages.hatchling ];

        dependencies = with pythonPackages; [
          requests
          starlette
        ];

        pythonImportsCheck = [ "starlette_testclient" ];
      };

      # Use wheel for pyrate-limiter to avoid build deps issues
      pyrate-limiter = pythonPackages.buildPythonPackage {
        pname = "pyrate_limiter";
        version = "4.0.1";
        format = "wheel";

        src = pkgs.fetchurl {
          url = "https://files.pythonhosted.org/packages/26/78/b111df8d6117ede01465e763a37ba180969f5e878616067debfff92b12f4/pyrate_limiter-4.0.1-py3-none-any.whl";
          hash = "sha256-yVqBlclluBY31p6SCD0xUGuVS7npC6dRWIi0NTNUo30=";
        };

        pythonImportsCheck = [ "pyrate_limiter" ];
      };

      # Use wheel for jsonschema-rs since it's a Rust extension
      jsonschema-rs = pythonPackages.buildPythonPackage {
        pname = "jsonschema_rs";
        version = "0.41.0";
        format = "wheel";

        src = pkgs.fetchurl {
          url = "https://files.pythonhosted.org/packages/71/25/239008288cf7a126107d948eb6798a33d8ddc0f9e138038443b419040a63/jsonschema_rs-0.41.0-cp310-abi3-manylinux_2_17_x86_64.manylinux2014_x86_64.whl";
          hash = "sha256-zvaQw5+NZzvjDOhIEcEG3jMKIR+OnRTXkBh95sUs1XI=";
        };

        pythonImportsCheck = [ "jsonschema_rs" ];
      };
    in
    rec {
      packages.schemathesis = pythonPackages.buildPythonApplication {
        pname = "schemathesis";
        version = "4.10.2";
        pyproject = true;

        src = inputs.schemathesis;

        build-system = [ pythonPackages.hatchling ];

        dependencies = with pythonPackages; [
          click
          harfile
          httpx
          hypothesis
          hypothesis-graphql
          hypothesis-jsonschema
          jsonschema
          jsonschema-rs
          junit-xml
          pyrate-limiter
          pytest
          pyyaml
          requests
          rich
          starlette-testclient
          tenacity
          typing-extensions
          werkzeug
        ];

        # Disable tests during build (they require network access and test fixtures)
        doCheck = false;

        pythonImportsCheck = [ "schemathesis" ];

        meta = with pkgs.lib; {
          description = "Property-based testing framework for Open API and GraphQL based apps";
          homepage = "https://github.com/schemathesis/schemathesis";
          license = licenses.mit;
          mainProgram = "schemathesis";
        };
      };

      checks.schemathesis = packages.schemathesis;
    };
}
