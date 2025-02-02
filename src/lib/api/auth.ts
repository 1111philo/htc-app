import * as Auth from "aws-amplify/auth";
import { Amplify } from "aws-amplify";
import { useGlobalStore } from "../utils";

/* NOTE: 25.01.27: the login view renders outside of the routing
system altogether (see `root.render` in main.tsx) to avoid showing
the nav or flashing any views before rendering login.

There's definitely a better way to do this. */

export async function login(email, password): Promise<boolean> {
  try {
    await Auth.signIn({ username: email, password: password });
  } catch (err) {
    if (err.name === "NotAuthorizedException") {
      return false;
    }
    throw err; // throw if unexpected error
  }
  useGlobalStore.setState({ authenticated: true });
  // location.pathname = "/";
  return true;
}

export async function logout() {
  await Auth.signOut();
}

export async function isLoggedIn() {
  try {
    await Auth.getCurrentUser();
    return true;
  } catch (err) {
    return false;
  }
}

export function configure() {
  console.log("ENV vars check:", {
    userPoolId: import.meta.env.VITE_USERPOOLID,
    clientId: import.meta.env.VITE_USERPOOLWEBCLIENTID,
    apiUrl: import.meta.env.VITE_API_URL,
  });
  Amplify.configure(
    {
      Auth: {
        Cognito: {
          userPoolId: import.meta.env.VITE_USERPOOLID,
          userPoolClientId: import.meta.env.VITE_USERPOOLWEBCLIENTID,
        },
      },
      API: {
        REST: {
          public: {
            endpoint: `${import.meta.env.VITE_API_URL}/public`,
          },
          auth: {
            endpoint: `${import.meta.env.VITE_API_URL}/auth`,
          },
        },
      },
    },
    {
      API: {
        REST: {
          headers: async ({ apiName }) =>
            apiName === "auth"
              ? {
                  Authorization: `Bearer ${(
                    await Auth.fetchAuthSession()
                  ).tokens?.idToken?.toString()}`,
                }
              : { "X-Api-Key": "1" },
        },
      },
    }
  );
}
