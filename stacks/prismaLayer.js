import { Code, LayerVersion, LayerVersionProps } from "@aws-cdk/aws-lambda";
import { Construct } from "@aws-cdk/core";
import crypto from "crypto";
import path from "path";

// deps to npm install to the layer
const PRISMA_DEPS = [
  "prisma",
  "@prisma/migrate",
  "@prisma/sdk",
  "@prisma/client",
];

export const PRISMA_LAYER_EXTERNAL = [
  "aws-sdk",
  "@prisma/migrate",
  "@prisma/sdk",
  "@prisma/engines",
  "@prisma/engines-version",
];
/**
 * Construct a lambda layer with Prisma libraries.
 * Be sure to omit the prisma layer modules from your function bundles with the `externalModules` option.
 * Include `environment` to point prisma at the right library location.
 *
 * @example
 * ```ts
 *   const prismaLayer = new PrismaLayer(this, "PrismaLayer", {
 *     layerVersionName: `${id}-prisma`,
 *     removalPolicy: isProduction ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
 *   })
 *
 *   // default lambda function options
 *   const functionOptions: FunctionOptions = {
 *     layers: [prismaLayer],
 *     environment: { ...prismaLayer.environment, DEBUG: "*" },
 *     bundling: {
 *       externalModules: prismaLayer.externalModules,
 *     },
 *   }
 */
export class PrismaLayer extends LayerVersion {
  externalModules;
  environment;

  constructor(scope, id, props = {}) {
    const { prismaVersion } = props;
    const nodeModules = props.nodeModules || [];

    const layerDir = "/asset-output/nodejs";
    const nm = `${layerDir}/node_modules`;
    const engineDir = `${nm}/@prisma/engines`;
    const sdkDir = `${nm}/@prisma/sdk`;

    // what are we asking npm to install?
    let modulesToInstall = PRISMA_DEPS;
    if (prismaVersion)
      modulesToInstall = modulesToInstall.map(
        (dep) => `${dep}@${prismaVersion}`
      );
    const modulesToInstallArgs = modulesToInstall.concat(nodeModules).join(" ");

    const createBundleCommand = [
      // create asset bundle in docker
      "bash",
      "-c",
      [
        `mkdir -p ${layerDir}`,
        // install PRISMA_DEPS
        `cd ${layerDir} && HOME=/tmp npm install ${modulesToInstallArgs}`,
        // delete unneeded engines
        `rm -f ${engineDir}/introspection-engine* ${engineDir}/prisma-fmt*`,
        // sdk sux
        `rm -f ${sdkDir}/dist/libquery_engine*`,
        `rm -rf ${sdkDir}/dist/get-generators/*engine*`,
        // get rid of some junk
        `rm -rf ${nm}/prisma/build/public`,
        `rm -rf ${nm}/prisma/prisma-client/src/__tests__`,
        `rm -rf ${nm}/@types`,
      ].join(" && "),
    ];

    // hash our parameters so we know when we need to rebuild
    const bundleCommandHash = crypto.createHash("sha256");
    bundleCommandHash.update(JSON.stringify(createBundleCommand));

    // bundle
    // const code = Code.fromAsset(".", {
    //   // don't send all our files to docker (slow)
    //   ignoreMode: IgnoreMode.GLOB,
    //   exclude: ["*"],

    //   // if our bundle commands (basically our "dockerfile") changes then rebuild the image
    //   assetHashType: AssetHashType.CUSTOM,
    //   assetHash: bundleCommandHash.digest("hex"),

    //   bundling: {
    //     image: DEFAULT_RUNTIME.bundlingImage,
    //     command: createBundleCommand,
    //   },
    // })

    const code = Code.fromAsset(path.join("prisma.zip"));

    super(scope, id, { ...props, code });

    // hint for prisma to find the engine
    this.environment = {
      PRISMA_QUERY_ENGINE_LIBRARY:
        "/opt/nodejs/node_modules/@prisma/engines/libquery_engine-rhel-openssl-1.0.x.so.node",
    };
    // modules provided by layer
    this.externalModules = [...PRISMA_LAYER_EXTERNAL, ...nodeModules];
  }
}
