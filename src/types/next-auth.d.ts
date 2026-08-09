import type { UserRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      /**
       * Named permissions for a STAFF account. Always present (empty for
       * everyone else) so `can()` never has to guess whether the field was
       * simply missing from an older token.
       */
      permissions: string[];
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    permissions?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    permissions?: string[];
  }
}
