{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    inputs@{ self, ... }:
    inputs.flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = inputs.nixpkgs.legacyPackages.${system};
      in
      {
        packages = rec {
          default = pkgs.callPackage ./package.nix { };
          pipe = default;
        };
      }
    )
    // {
      nixosModules.pipe =
        {
          config,
          lib,
          pkgs,
          ...
        }:
        let
          cfg = config.services.pipe;
          pipe = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
        in
        {
          options.services.pipe = {
            enable = lib.mkEnableOption "pipe";

            port = lib.mkOption {
              type = lib.types.int;
              default = 3000;
            };

            databaseUrl = lib.mkOption {
              type = lib.types.str;
            };
          };

          config = lib.mkIf cfg.enable {
            systemd.services.pipe = {
              wantedBy = [ "multi-user.target" ];
              environment = {
                PORT = toString cfg.port;
                DATABASE_URL = cfg.databaseUrl;
              };
              serviceConfig = {
                Restart = "always";
                ExecStart = "${pipe}/bin/pipe";
              };
            };
          };
        };
    };
}
