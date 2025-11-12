"use client";

import { MailIcon } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGoogleLogin } from "@/hooks/useAuth";

export default function SignUpForm() {
  //login with google
  const { loginWithGoogle } = useGoogleLogin();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-eco-primary/10 via-background to-eco-success/10 pt-16">
      <Card className="w-full max-w-md p-6 shadow-lg border border-eco-primary/20 rounded-2xl transition-all hover:shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold text-foreground">
            Create your Account
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign up quickly using your Google account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-eco-primary text-eco-primary hover:bg-eco-primary hover:text-white hover:scale-[1.02] transition-all"
            onClick={loginWithGoogle}
          >
            <MailIcon className="h-5 w-5" />
            Continue with Google
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            By signing up, you agree to our{" "}
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
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-eco-primary hover:underline"
            >
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
