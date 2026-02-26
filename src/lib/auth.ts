const TOKEN_KEY = "kestrel_token";

export const auth = {
    setToken: (token: string) => {
        if (typeof window !== "undefined") {
            localStorage.setItem(TOKEN_KEY, token);
        }
    },

    getToken: (): string | null => {
        if (typeof window !== "undefined") {
            return localStorage.getItem(TOKEN_KEY);
        }
        return null;
    },

    removeToken: () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem(TOKEN_KEY);
        }
    },

    isLoggedIn: (): boolean => {
        return !!auth.getToken();
    },
};
