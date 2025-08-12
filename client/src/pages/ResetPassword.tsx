import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

// Password validation schema
const passwordSchema = z.string()
  .min(8, "비밀번호는 최소 8자 이상이어야 합니다(Password must be at least 8 characters)")
  .regex(/[A-Z]/, "대문자가 포함되어야 합니다(Must contain uppercase letter)")
  .regex(/[$*!#]/, "특수기호($, *, !, #) 중 하나가 포함되어야 합니다(Must contain special character: $, *, !, #)");

const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, "비밀번호 확인을 입력해주세요(Password confirmation is required)"),
}).refine(
  (data: any) => data.newPassword === data.confirmPassword,
  {
    message: "비밀번호가 일치하지 않습니다(Passwords do not match)",
    path: ["confirmPassword"],
  }
);

type ResetPasswordFormValues = {
  newPassword: string;
  confirmPassword: string;
};

export default function ResetPassword() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Extract token from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    setToken(tokenParam);
  }, []);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordFormValues) => {
      return apiRequest({
        url: "/api/reset-password",
        method: "POST",
        body: {
          token,
          newPassword: data.newPassword,
        },
      });
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "비밀번호 재설정 성공",
        description: "비밀번호가 성공적으로 재설정되었습니다. 이제 새 비밀번호로 로그인하세요.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "비밀번호 재설정 실패",
        description: error.message || "비밀번호 재설정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ResetPasswordFormValues) => {
    if (!token) {
      toast({
        title: "오류",
        description: "유효하지 않은 재설정 링크입니다.",
        variant: "destructive",
      });
      return;
    }
    resetPasswordMutation.mutate(data);
  };

  if (!token) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-red-600">
                유효하지 않은 링크
              </CardTitle>
              <CardDescription>
                비밀번호 재설정 링크가 유효하지 않거나 만료되었습니다.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Link href="/auth">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  로그인 페이지로
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-green-600">
                비밀번호 재설정 완료
              </CardTitle>
              <CardDescription>
                새 비밀번호로 로그인하실 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Link href="/auth">
                <Button>
                  로그인하기
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Link href="/auth">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              로그인으로 돌아가기
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              새 비밀번호 설정
            </CardTitle>
            <CardDescription className="text-center">
              새로운 비밀번호를 입력하세요
            </CardDescription>
          </CardHeader>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  새 비밀번호(New Password)
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    className="pl-10 pr-12"
                    placeholder="새 비밀번호 입력"
                    {...form.register("newPassword")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-8 w-8"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  최소 8자, 대문자, 특수기호($, *, !, #) 포함 필수
                </p>
                {form.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  비밀번호 확인(Confirm Password)
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className="pl-10 pr-12"
                    placeholder="비밀번호 다시 입력"
                    {...form.register("confirmPassword")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-8 w-8"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter>
              <Button 
                className="w-full" 
                type="submit" 
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    재설정 중...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Lock className="mr-2 h-4 w-4" />
                    비밀번호 재설정
                  </div>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}