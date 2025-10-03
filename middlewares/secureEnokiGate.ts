import { GetServerSidePropsContext } from "next";
import jwt from "jsonwebtoken";
import axios from "axios";
import { parse } from "cookie";

const redirectIfLoggedIn = ["/login", "/create-enoki-instance"];
const protectedRoutes = [
  "/",
  "/teachers",
  "/departments",
  "/courses",
  "/students",
];

export const authGate = async (ctx: GetServerSidePropsContext) => {
  const cookie = parse(ctx.req.headers.cookie || "")?.refreshToken || "";
  const { query } = ctx;
  const server = process.env.API;

  const resolvedUrl = ctx.resolvedUrl.split("?")[0];

  try {
    console.log("URL: ", `${server}/rehydrate`);
    const res = await axios.post(
      `${server}/rehydrate`,
      {},
      {
        headers: {
          Cookie: cookie,
        },
      }
    );

    const userData = {
      ...(jwt.decode(res.data.token) as object),
      token: res.data.token,
    };

    if (redirectIfLoggedIn.some((route) => route === resolvedUrl)) {
      return {
        redirect: {
          destination: "/404",
          permanent: false,
        },
      };
    }

    return {
      props: {
        user: userData,
        queries: query,
        api: server,
      },
    };
  } catch (e) {
    if (protectedRoutes.some((route) => route === resolvedUrl)) {
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    return {
      props: {
        user: null,
        queries: query,
        api: server,
      },
    };
  }
};
