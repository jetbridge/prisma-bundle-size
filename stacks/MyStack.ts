import * as sst from "@serverless-stack/resources";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { Tracing } from "@aws-cdk/aws-lambda";
import { Construct } from "@aws-cdk/core";
import { StackProps } from "@serverless-stack/resources";

export default class MyStack extends sst.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Create a HTTP API
    const api = new sst.Api(this, "Api", {
      routes: {
        "GET /no-prisma": "src/lambda.handler",
        "GET /prisma": {
          function: {
            handler: "src/prisma.handler",
            environment: {
              // ...layer.environment,
              DATABASE_URL: "file:./dev.db",
              DEBUG: "*",
            },
            bundle: {
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
          },
        },
      },
    });

    // Show the endpoint in the output
    this.addOutputs({
      ApiEndpoint: api.url,
    });

    // const layer = new PrismaLayer(this, "layer", {})

    new NodejsFunction(this, "nodb", {
      tracing: Tracing.ACTIVE,
      entry: __dirname + "/../../src/index.empty.ts",
    });
  }
}
