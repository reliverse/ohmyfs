import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ModeToggle } from "~/components/mode-toggle";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useAuth } from "~/contexts/auth-context";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, signUp, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const getButtonText = () => {
    if (isLoading) {
      return isSignUp ? "Creating account..." : "Signing in...";
    }
    return isSignUp ? "Sign Up" : "Sign In";
  };

  if (isAuthenticated) {
    navigate({ to: "/", replace: true });
    return null;
  }

  const handleSignUp = async (): Promise<boolean> => {
    const result = await signUp(username, email, password);
    if (result.success) {
      toast.success("Account created successfully!");
      navigate({ to: "/" });
      return true;
    }
    toast.error(result.error || "Sign up failed");
    return false;
  };

  const handleLogin = async (): Promise<boolean> => {
    const result = await login(username, password);
    if (result.success) {
      toast.success("Signed in successfully!");
      navigate({ to: "/" });
      return true;
    }
    toast.error(result.error || "Login failed");
    return false;
  };

  const isFormValid = (): boolean => {
    if (!(username.trim() && password.trim())) {
      return false;
    }
    if (isSignUp && !(email.trim() && confirmPassword.trim())) {
      return false;
    }
    return true;
  };

  const validateForm = (): string | null => {
    if (!username.trim()) {
      return "Username is required";
    }
    if (!password.trim()) {
      return "Password is required";
    }
    if (isSignUp) {
      if (!email.trim()) {
        return "Email is required";
      }
      if (password !== confirmPassword) {
        return "Passwords do not match";
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        await handleSignUp();
      } else {
        await handleLogin();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card p-8 backdrop-blur-sm">
        <div className="mb-6 text-center">
          <h1 className="mb-2 font-bold text-3xl text-primary">OhMyFS</h1>
          <p className="text-muted-foreground">
            {isSignUp ? "Create your account" : "Sign in to continue"}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label className="text-primary/80" htmlFor="username">
              Username
            </Label>
            <Input
              className="mt-1 text-foreground"
              disabled={isLoading}
              id="username"
              onChange={(e) => setUsername(e.target.value)}
              required
              type="text"
              value={username}
            />
          </div>

          {isSignUp && (
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                className="mt-1 text-foreground"
                disabled={isLoading}
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                required
                type="email"
                value={email}
              />
            </div>
          )}

          <div>
            <Label className="text-primary/80" htmlFor="password">
              Password
            </Label>
            <Input
              className="mt-1 text-foreground"
              disabled={isLoading}
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          {isSignUp && (
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                className="mt-1 text-foreground"
                disabled={isLoading}
                id="confirmPassword"
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
            </div>
          )}

          <Button
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isLoading || !isFormValid()}
            type="submit"
          >
            {isLoading && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            )}
            {getButtonText()}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            className="text-muted-foreground text-sm hover:text-foreground"
            disabled={isLoading}
            onClick={() => {
              setIsSignUp(!isSignUp);
            }}
            type="button"
            variant="ghost"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </Button>
        </div>

        <div className="mt-4 flex justify-center">
          <ModeToggle variant="button" />
        </div>
      </Card>
    </div>
  );
}
