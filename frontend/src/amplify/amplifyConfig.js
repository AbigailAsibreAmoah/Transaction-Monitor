import { Amplify } from "aws-amplify";

export async function configureAmplify() {
  Amplify.configure({
    Auth: {
      Cognito: {
        region: "us-east-1",
        userPoolId: "us-east-1_A0uNY4Q07",
        userPoolClientId: "6h56ikffem49ph32j830bvj7h",
      }
    }
  });
}
