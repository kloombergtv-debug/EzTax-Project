import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, CheckCircle } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, "이메일을 입력해주세요(Email is required)")
    .email("올바른 이메일 형식을 입력해주세요(Please enter a valid email)")
});

type ForgotPasswordFormValues = {
  email: string;
};

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
  const { toast } = useToast();
  const [isEmailSent, setIsEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormValues) => {
      return apiRequest({
        url: "/api/forgot-password",
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      setIsEmailSent(true);
      toast({
        title: "이메일 발송 완료",
        description: "비밀번호 재설정 링크가 이메일로 발송되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "오류 발생",
        description: error.message || "비밀번호 재설정 요청 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotPasswordFormValues) => {
    forgotPasswordMutation.mutate(data);
  };

  const handleClose = () => {
    setIsEmailSent(false);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isEmailSent ? "이메일 발송 완료" : "비밀번호 찾기"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isEmailSent 
              ? "비밀번호 재설정 링크를 이메일로 발송했습니다" 
              : "가입할 때 사용한 이메일 주소를 입력하세요"}
          </DialogDescription>
        </DialogHeader>

        {isEmailSent ? (
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-4">
              이메일을 확인하고 비밀번호 재설정 링크를 클릭하세요.
              <br />
              이메일이 오지 않았다면 스팸 폴더를 확인해보세요.
            </p>
            <p className="text-xs text-gray-500">
              링크는 1시간 후 만료됩니다.
            </p>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  이메일 주소 (Email Address)
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10"
                    placeholder="example@email.com"
                    {...form.register("email")}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="sm:justify-center">
              <Button 
                type="submit" 
                disabled={forgotPasswordMutation.isPending}
                className="w-full"
              >
                {forgotPasswordMutation.isPending ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    발송 중...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Mail className="mr-2 h-4 w-4" />
                    재설정 링크 발송
                  </div>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {isEmailSent && (
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="w-full"
            >
              확인
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}