import React, { useState, useEffect, createContext, useContext } from "react";
import {
  MsalProvider,
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
  useMsal,
} from "@azure/msal-react";
import type { IPublicClientApplication } from "@azure/msal-browser";

import { loginRequest } from "../authConfig";

// Create context for logout functionality
const AuthContext = createContext<{ logout: () => void } | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  msalInstance: IPublicClientApplication;
  children: React.ReactNode;
}

// Local auth credentials (in production, this should be in a secure backend)
const LOCAL_USERNAME = "admin";
const LOCAL_PASSWORD = "password";
const LOCAL_AUTH_KEY = "excalidraw_local_auth";

/**
 * Login screen shown when user is not authenticated
 */
const LoginScreen: React.FC<{ onLocalLogin: () => void }> = ({
  onLocalLogin,
}) => {
  const { instance } = useMsal();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showLocalLogin, setShowLocalLogin] = useState(false);

  const handleSSOLogin = () => {
    instance.loginRedirect(loginRequest).catch((e) => {
      // eslint-disable-next-line no-console
      console.error("SSO Login failed:", e);
    });
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
          Excalidraw
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
              onClick={handleSSOLogin}
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
                marginBottom: "16px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#106ebe";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#0078d4";
              }}
            >
              Sign in with Microsoft
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
 * Wrapper component that handles both Azure AD and local authentication
 */
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLocallyAuthenticated, setIsLocallyAuthenticated] = useState(false);
  const { instance } = useMsal();

  // Check for local authentication on mount
  useEffect(() => {
    const localAuth = localStorage.getItem(LOCAL_AUTH_KEY);
    if (localAuth === "true") {
      setIsLocallyAuthenticated(true);
    }
  }, []);

  const handleLocalLogin = () => {
    setIsLocallyAuthenticated(true);
  };

  const handleLogout = () => {
    // Clear local auth
    localStorage.removeItem(LOCAL_AUTH_KEY);
    setIsLocallyAuthenticated(false);

    // Logout from Azure AD (if logged in via SSO)
    instance.logoutRedirect().catch((e) => {
      // eslint-disable-next-line no-console
      console.error("Logout failed:", e);
    });
  };

  // If locally authenticated, show the app directly with logout capability
  if (isLocallyAuthenticated) {
    return (
      <AuthContext.Provider value={{ logout: handleLogout }}>
        {children}
      </AuthContext.Provider>
    );
  }

  // Otherwise, show the login screen (which handles both SSO and local auth)
  return (
    <AuthContext.Provider value={{ logout: handleLogout }}>
      <AuthenticatedTemplate>{children}</AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <LoginScreen onLocalLogin={handleLocalLogin} />
      </UnauthenticatedTemplate>
    </AuthContext.Provider>
  );
};

/**
 * AuthProvider wraps the app and provides SSO and local authentication
 * - Shows login screen if user is not authenticated
 * - Shows the app if user is authenticated (via Azure AD SSO or local login)
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({
  msalInstance,
  children,
}) => {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthWrapper>{children}</AuthWrapper>
    </MsalProvider>
  );
};
