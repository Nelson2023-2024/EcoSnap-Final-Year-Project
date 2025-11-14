"use client";

import { MailIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGoogleLogin, useAuthUser } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function LoginForm() {
  const { loginWithGoogle } = useGoogleLogin();
  const { data: user, isLoading } = useAuthUser();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      // Redirect based on role
      if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/user-dashboard");
      }
    }
  }, [user, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-eco-primary/10 via-background to-eco-success/10">
        <Loader2 className="h-12 w-12 animate-spin text-eco-primary" />
      </div>
    );
  }

  // Don't render login form if user is authenticated
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-eco-primary/10 via-background to-eco-success/10 pt-16">
      <Card className="w-full max-w-md p-6 shadow-lg border border-eco-primary/20 rounded-2xl transition-all hover:shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold text-foreground">
            Login into your Account
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to your account with Google
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-eco-primary text-foreground hover:bg-eco-primary hover:text-white hover:scale-[1.02] transition-all"
            onClick={loginWithGoogle}
          >
            <MailIcon className="h-5 w-5" />
            Continue with Google
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <Link
              href="/terms"
              className="underline text-eco-primary hover:text-eco-primary/80"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline text-eco-primary hover:text-eco-primary/80"
            >
              Privacy Policy
            </Link>
            .
          </p>

          <p className="text-sm text-center text-foreground">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-eco-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}