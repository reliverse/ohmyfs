import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  type ApiResponse,
  apiState,
  createUser,
  loginUser,
  type User,
  updateUser,
} from "~/lib/api-client";
import { normalizeAuthError } from "~/utils/error-messages";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    username: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "ohmyfs_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStoredUser = () => {
      try {
        const stored = localStorage.getItem(USER_STORAGE_KEY);
        if (stored) {
          const parsedUser = JSON.parse(stored) as User;
          setUser(parsedUser);
        }
      } catch {
        // Ignore invalid stored data
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredUser();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = (await loginUser(
        apiState,
        username,
        password
      )) as ApiResponse<{ user: User }>;
      if (response.success && response.data?.user) {
        const loggedInUser = response.data.user;
        setUser(loggedInUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser));

        await updateUser(apiState, loggedInUser._id, { cliStarted: true });

        return { success: true };
      }
      return {
        success: false,
        error: normalizeAuthError(response.error, "login"),
      };
    } catch (error) {
      return {
        success: false,
        error: normalizeAuthError(
          error instanceof Error ? error.message : undefined,
          "login"
        ),
      };
    }
  }, []);

  const signUp = useCallback(
    async (username: string, email: string, password: string) => {
      try {
        const response = await createUser(apiState, {
          username,
          email,
          password,
        });
        if (response.success && response.data) {
          const loginResponse = (await loginUser(
            apiState,
            username,
            password
          )) as ApiResponse<{ user: User }>;
          if (loginResponse.success && loginResponse.data?.user) {
            const newUser = loginResponse.data.user;
            setUser(newUser);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));

            await updateUser(apiState, newUser._id, { cliStarted: true });

            return { success: true };
          }
          return {
            success: false,
            error: normalizeAuthError(loginResponse.error, "login"),
          };
        }
        return {
          success: false,
          error: normalizeAuthError(response.error, "signup"),
        };
      } catch (error) {
        return {
          success: false,
          error: normalizeAuthError(
            error instanceof Error ? error.message : undefined,
            "signup"
          ),
        };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    if (user) {
      try {
        await updateUser(apiState, user._id, { cliStarted: false });
      } catch {
        // Ignore logout errors
      }
    }
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  }, [user]);

  const refreshUser = useCallback((): Promise<void> => {
    if (!user) {
      return Promise.resolve();
    }

    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const parsedUser = JSON.parse(stored) as User;
        setUser(parsedUser);
      }
    } catch {
      // Ignore refresh errors
    }
    return Promise.resolve();
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signUp,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
