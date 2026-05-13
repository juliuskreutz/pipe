{
  stdenv,
  makeWrapper,
  nodejs,
  pnpm,
  fetchPnpmDeps,
  pnpmConfigHook,
}:
stdenv.mkDerivation (finalAttrs: {
  pname = "pipe";
  version = "0.0.1";

  src = ./.;

  pnpmDeps = fetchPnpmDeps {
    inherit (finalAttrs) pname version src;
    fetcherVersion = 3;
    hash = "sha256-Gw2y2sDMlubehQFs6umiWnUZWngzMIqR/K6eFXcK+Es=";
  };

  nativeBuildInputs = [
    makeWrapper
    nodejs
    pnpm
    pnpmConfigHook
  ];

  buildPhase = ''
    runHook preBuild

    pnpm run build

    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall

    mkdir -p $out/{lib,bin}

    cp -r .output $out/lib/pipe
    cp -r drizzle $out/lib/

    makeWrapper ${nodejs}/bin/node $out/bin/pipe \
      --add-flags "$out/lib/pipe/server/index.mjs" \
      --run "cd $out/lib"

    runHook postInstall
  '';
})
