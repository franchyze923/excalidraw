import React, { useState, useEffect, createContext, useContext } from "react";
import { OAuthClient } from "../lib/oauth";
import { oauthConfig } from "../oauthConfig";

interface AuthContextType {
  isAuthenticated: boolean;
  logout: () => void;
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within OAuthAuthProvider");
  }
  return context;
};

const oauthClient = new OAuthClient(oauthConfig);

// Local auth credentials (for fallback/testing)
const LOCAL_USERNAME = "admin";
const LOCAL_PASSWORD = "password";
const LOCAL_AUTH_KEY = "excalidraw_local_auth";

/**
 * Login screen shown when user is not authenticated
 */
const LoginScreen: React.FC<{ onLocalLogin: () => void }> = ({
  onLocalLogin,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showLocalLogin, setShowLocalLogin] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleOAuthLogin = async () => {
    try {
      setIsLoggingIn(true);
      await oauthClient.initiateLogin();
    } catch (err) {
      setError("OAuth login failed. Please try again.");
      setIsLoggingIn(false);
      // eslint-disable-next-line no-console
      console.error("OAuth login error:", err);
    }
  };

  const handleLocalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (username === LOCAL_USERNAME && password === LOCAL_PASSWORD) {
      localStorage.setItem(LOCAL_AUTH_KEY, "true");
      onLocalLogin();
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#121212",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "400px",
          width: "100%",
          padding: "40px",
          backgroundColor: "#1e1e1e",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
        }}
      >
        <h1
          style={{
            marginBottom: "16px",
            fontSize: "32px",
            textAlign: "center",
          }}
        >
          Excalidraw +11
        </h1>
        <p
          style={{
            marginBottom: "32px",
            fontSize: "16px",
            color: "#b0b0b0",
            textAlign: "center",
          }}
        >
          Sign in to access Excalidraw
        </p>

        {!showLocalLogin ? (
          <>
            <button
              onClick={handleOAuthLogin}
              disabled={isLoggingIn}
              style={{
                width: "100%",
                padding: "12px 24px",
                fontSize: "16px",
                fontWeight: "600",
                color: "#fff",
                backgroundColor: isLoggingIn ? "#666" : "#0078d4",
                border: "none",
                borderRadius: "4px",
                cursor: isLoggingIn ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
                marginBottom: "16px",
              }}
              onMouseEnter={(e) => {
                if (!isLoggingIn) {
                  e.currentTarget.style.backgroundColor = "#106ebe";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoggingIn) {
                  e.currentTarget.style.backgroundColor = "#0078d4";
                }
              }}
            >
              {isLoggingIn ? "Redirecting..." : "Sign in with Company SSO"}
            </button>

            <div
              style={{
                position: "relative",
                textAlign: "center",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  borderTop: "1px solid #444",
                  position: "absolute",
                  width: "100%",
                  top: "50%",
                }}
              />
              <span
                style={{
                  position: "relative",
                  backgroundColor: "#1e1e1e",
                  padding: "0 10px",
                  color: "#888",
                  fontSize: "14px",
                }}
              >
                OR
              </span>
            </div>

            <button
              onClick={() => setShowLocalLogin(true)}
              style={{
                width: "100%",
                padding: "12px 24px",
                fontSize: "16px",
                fontWeight: "600",
                color: "#fff",
                backgroundColor: "#2d2d2d",
                border: "1px solid #444",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#3d3d3d";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#2d2d2d";
              }}
            >
              Sign in with Local Account
            </button>
          </>
        ) : (
          <form onSubmit={handleLocalLogin}>
            <div style={{ marginBottom: "16px" }}>
              <label
                htmlFor="username"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  color: "#b0b0b0",
                }}
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "14px",
                  backgroundColor: "#2d2d2d",
                  border: "1px solid #444",
                  borderRadius: "4px",
                  color: "#fff",
                  boxSizing: "border-box",
                }}
                placeholder="Enter username"
                autoFocus
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  color: "#b0b0b0",
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "14px",
                  backgroundColor: "#2d2d2d",
                  border: "1px solid #444",
                  borderRadius: "4px",
                  color: "#fff",
                  boxSizing: "border-box",
                }}
                placeholder="Enter password"
              />
            </div>

            {error && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "10px",
                  backgroundColor: "#3d1f1f",
                  border: "1px solid #5d2f2f",
                  borderRadius: "4px",
                  color: "#ff6b6b",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px 24px",
                fontSize: "16px",
                fontWeight: "600",
                color: "#fff",
                backgroundColor: "#0078d4",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "background-color 0.2s",
                marginBottom: "12px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#106ebe";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#0078d4";
              }}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => {
                setShowLocalLogin(false);
                setError("");
                setUsername("");
                setPassword("");
              }}
              style={{
                width: "100%",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: "400",
                color: "#b0b0b0",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              Back to login options
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

/**
 * Callback handler for OAuth redirect
 * Should be rendered on the redirect_uri page (e.g., /auth/callback)
 */
export const OAuthCallbackHandler: React.FC<{
  onSuccess: () => void;
  onError: (error: string) => void;
}> = ({ onSuccess, onError }) => {
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const state = params.get("state");
        const error = params.get("error");

        if (error) {
          onError(`OAuth error: ${error}`);
          return;
        }

        if (!code || !state) {
          onError("Invalid callback parameters");
          return;
        }

        const token = await oauthClient.handleCallback(code, state);
        if (token) {
          onSuccess();
        } else {
          onError("Failed to exchange authorization code");
        }
      } catch (err) {
        onError(
          `Callback error: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    };

    handleCallback();
  }, [onSuccess, onError]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#121212",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p>Completing login...</p>
      </div>
    </div>
  );
};

/**
 * Wrapper component that handles both OAuth and local authentication
 */
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLocallyAuthenticated, setIsLocallyAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [callbackError, setCallbackError] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      // Check if we're in an OAuth callback
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");

      if (error) {
        setCallbackError(`OAuth error: ${error}`);
        setIsLoading(false);
        return;
      }

      // Check local auth first
      const localAuth = localStorage.getItem(LOCAL_AUTH_KEY);
      if (localAuth === "true") {
        setIsLocallyAuthenticated(true);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // Check OAuth token
      if (oauthClient.isAuthenticated()) {
        setAccessToken(oauthClient.getAccessToken());
        setIsAuthenticated(true);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");

      if (!code || !state) {
        return; // Not a callback
      }

      try {
        const token = await oauthClient.handleCallback(code, state);
        if (token) {
          setAccessToken(token.accessToken);
          setIsAuthenticated(true);
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          setCallbackError("Failed to exchange authorization code");
        }
      } catch (err) {
        setCallbackError(
          `Callback error: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    };

    handleCallback();
  }, []);

  const handleLocalLogin = () => {
    setIsLocallyAuthenticated(true);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Clear local auth
    localStorage.removeItem(LOCAL_AUTH_KEY);
    setIsLocallyAuthenticated(false);

    // Clear OAuth token
    oauthClient.logout();

    setIsAuthenticated(false);
    setAccessToken(null);
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#121212",
          color: "#fff",
        }}
      >
        Loading...
      </div>
    );
  }

  if (callbackError) {
    return (
      <LoginScreen onLocalLogin={handleLocalLogin} />
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLocalLogin={handleLocalLogin} />;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        logout: handleLogout,
        accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

interface OAuthAuthProviderProps {
  children: React.ReactNode;
}

/**
 * OAuth Auth Provider wraps the app and provides SSO and local authentication
 * - Shows login screen if user is not authenticated
 * - Shows the app if user is authenticated (via OAuth SSO or local login)
 * - Includes OAuth callback handler
 */
export const OAuthAuthProvider: React.FC<OAuthAuthProviderProps> = ({
  children,
}) => {
  return <AuthWrapper>{children}</AuthWrapper>;
};
