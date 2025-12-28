import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, Settings as SettingsIcon, User } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useAuth } from "~/contexts/auth-context";

export const Route = createFileRoute("/account")({
  component: AccountPage,
});

function AccountPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    navigate({ to: "/auth", replace: true });
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="font-bold text-3xl">Account</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your account details and basic information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-medium text-muted-foreground text-sm">
                  Username
                </div>
                <p className="font-medium text-lg">{user?.username}</p>
              </div>
              <div>
                <div className="font-medium text-muted-foreground text-sm">
                  Account Status
                </div>
                <p className="font-medium text-green-600 text-sm">Active</p>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Account Actions
              </CardTitle>
              <CardDescription>
                Manage your account and session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={handleLogout}
                variant="outline"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Future features placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              Additional account features will be available here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-muted-foreground text-sm">
              <li>• Password change</li>
              <li>• Account deletion</li>
              <li>• Data export</li>
              <li>• Notification preferences</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
