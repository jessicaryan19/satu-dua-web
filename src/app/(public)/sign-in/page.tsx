"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { signIn } from "@/services/authService"; // make sure this path is correct
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function SignInPage() {
  const router = useRouter();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (auth.session) {
      router.push("/");
    }
  }, []);


  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await signIn(email, password);


    if (error) {
      setErrorMessage(error.message);
    } else {
      if (data.user) {
        const role = data.user.user_metadata?.role;
        if (role === "operator" || role === "dispatcher") {
          router.push("/");
        } else {
          setErrorMessage("Your account does not have access to this application.");
        }
      }
      else {
        setErrorMessage("Login failed. Please try again later.");
        // Optionally log unexpected login failure for debugging
        console.warn("Login failed: no error, but user is missing", { data, error });
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex w-screen h-screen">
      {/* Left Image */}
      <div className="w-1/2 h-full p-6">
        <div className="bg-accent w-full h-full rounded-4xl flex items-center justify-center p-12">
          <div className="relative w-full h-full">
            <Image
              className="object-contain"
              src="/login.svg"
              alt="login"
              fill
            />
          </div>
        </div>
      </div>
      {/* Login Form */}
      <div className="flex flex-col gap-20 w-1/2 h-full justify-center items-center p-28">
        <div className="flex flex-col gap-2 items-center justify-center">
          <Label type="title" className="text-primary text-center w-full">Bertugas Dengan Sigap,</Label>
          <Label type="title" className="text-primary text-center w-full">Melayani Tanpa Ragu.</Label>
          <Label type="subtitle" className="text-center w-full">Silahkan masuk untuk memulai.</Label>
        </div>

        <div className="flex flex-col gap-8 w-full">
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {errorMessage && (
          <p className="text-red-500 text-center w-full">{errorMessage}</p>
        )}

        <Button className="w-full" onClick={handleLogin} disabled={loading}>
          {loading ? "Loading..." : "Masuk"}
        </Button>
      </div>
    </div>
  )
}

