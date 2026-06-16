import { useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const state = useMemo(() => {
    // Usuário padrão sem autenticação
    const defaultUser = {
      id: 1,
      openId: "default-user",
      name: "Admin",
      email: "admin@discord-bot.local",
      loginMethod: "local",
      role: "admin" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    return {
      user: defaultUser,
      loading: false,
      error: null,
      isAuthenticated: true,
    };
  }, []);

  const logout = async () => {
    // Sem logout necessário
    console.log("Logout (sem autenticação)");
  };

  return {
    ...state,
    refresh: () => Promise.resolve(),
    logout,
  };
}
