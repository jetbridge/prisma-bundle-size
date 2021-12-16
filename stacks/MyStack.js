import * as sst from "@serverless-stack/resources";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { Tracing } from "@aws-cdk/aws-lambda";
import { PrismaLayer } from "./prismaLayer";

export default class MyStack extends sst.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create a HTTP API
    const api = new sst.Api(this, "Api", {
      routes: {
        "GET /": "src/lambda.handler",
      },
    });

    // Show the endpoint in the output
    this.addOutputs({
      ApiEndpoint: api.url,
    });

    const layer = new PrismaLayer(this, "layer", {});

    new NodejsFunction(this, "fun", {
      tracing: Tracing.ACTIVE,
      layers: [layer],
      environment: { ...layer.environment, DATABASE_URL: "file:./dev.db" },
      bundling: {
        metafile: true,
        commandHooks: {
          beforeInstall: () => [],
          beforeBundling: () => [],
          afterBundling: (inputDir, outputDir) => {
            return [
              `ls ${inputDir}`,
              `cp "${inputDir}/prisma/schema.prisma" "${outputDir}"`,
            ];
          },
        },
      },
      entry: __dirname + "/../../src/index.fun.ts",
    });

    new NodejsFunction(this, "nodb", {
      tracing: Tracing.ACTIVE,
      entry: __dirname + "/../../src/index.empty.ts",
    });
  }
}
