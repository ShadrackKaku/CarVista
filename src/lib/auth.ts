import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.hashedPassword) {
          throw new Error("Invalid email or password");
        }

        if (user.status === "SUSPENDED") {
          throw new Error("Your account has been suspended. Contact support.");
        }

        const valid = await bcrypt.compare(credentials.password, user.hashedPassword);
        if (!valid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          permissions: user.permissions,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: UserRole }).role ?? UserRole.USER;
        token.permissions = (user as { permissions?: string[] }).permissions ?? [];
      }
      // SECURITY: never trust a client-supplied role. On an explicit session
      // update, or when the role is missing (e.g. OAuth first sign-in), re-read
      // it from the database — the DB is the sole source of truth for role.
      // (Trusting `session.role` here would let any signed-in user call
      // `useSession().update({ role: "ADMIN" })` and escalate to admin.)
      // Permissions ride along with the role and are re-read on the same
      // trigger. A token minted before this field existed has no `permissions`
      // key at all, so its absence — not just an explicit update — forces the
      // re-read; otherwise a staff member's grants would stay invisible until
      // they next signed out.
      //
      // Privileged accounts are re-read on EVERY request, not just on those
      // triggers. The session is a 30-day JWT, so without this a permission
      // revoked today would keep working for a month — which would make the
      // permissions editor decorative in the one direction that matters. Only
      // STAFF, ADMIN and SUPER_ADMIN pay the extra read, and there are a
      // handful of those; ordinary users never touch the database here.
      const privileged =
        token.role === "STAFF" || token.role === "ADMIN" || token.role === "SUPER_ADMIN";

      if (
        (trigger === "update" ||
          !token.role ||
          token.permissions === undefined ||
          privileged) &&
        token.email
      ) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true, permissions: true, status: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.permissions = dbUser.permissions;
          // A suspended administrator keeps a valid token otherwise. Dropping
          // the role to USER strips every permission on the next request
          // rather than at the next sign-in.
          if (dbUser.status === "SUSPENDED") {
            token.role = UserRole.USER;
            token.permissions = [];
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.permissions = (token.permissions as string[] | undefined) ?? [];
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
