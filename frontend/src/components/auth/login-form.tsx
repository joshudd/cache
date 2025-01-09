"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { login, connectSpotify } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "../ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

const FormSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export default function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const spotifyCode = searchParams.get('spotify_code');
  const spotifyState = searchParams.get('state');

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      // login user
      await login(data.username, data.password);
      
      if (spotifyCode && spotifyState) {
        try {
          // connect spotify if code is present
          await connectSpotify(spotifyCode, spotifyState);
          router.push('/account/profile?success=true');
        } catch (error) {
          // if spotify connection fails, still redirect to dashboard
          // but show error message
          toast({
            title: "Warning",
            description: "Logged in successfully but Spotify connection failed.",
            variant: "default",
          });
          router.push('/dashboard');
        }
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Login failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="password" placeholder="Password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-center">
            <Button type="submit" variant="default" className="w-full">
              {form.formState.isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
          </div>
        </form>
      </Form>
      <div className="text-center text-sm w-full max-w-sm">
        or
        <Button variant="link" asChild className="text-primary">
          <Link href="/signup">
            create account
          </Link>
        </Button>
      </div>
    </div>
  );
}
