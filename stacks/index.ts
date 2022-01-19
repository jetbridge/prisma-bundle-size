import { App } from "@serverless-stack/resources";
import MyStack from "./MyStack";

export default function main(app: App) {
  // Set default runtime for all functions
  app.setDefaultFunctionProps({
    runtime: "nodejs12.x",
  });

  new MyStack(app, "my-stack", {});

  // Add more stacks
}
