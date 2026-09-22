import React from "react";
import { mockPackages } from "@/mocks/memberData";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export const TrainingPackages: React.FC = () => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleRegister = (pkgId: string) => {
    alert(`Đã chọn gói: ${pkgId}. Đang tạo yêu cầu...`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Các Gói Tập Luyện
        </h1>
        <p className="text-muted-foreground">
          Chọn gói tập phù hợp nhất với mục tiêu sức khỏe của bạn.
        </p>
      </div>

      {/* Grid danh sách Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch mt-8 pt-4">
        {mockPackages.map((pkg) => (
          <Card
            key={pkg.id}
            /* Thêm overflow-visible để Badge không bị đè cắt lề, ép p-6 trực tiếp lên Card */
            className={`relative flex flex-col justify-between h-full bg-white shadow-sm transition-all duration-200 hover:shadow-md border-slate-200 p-6 overflow-visible ${
              pkg.isPopular ? "border-2 border-primary shadow-md" : ""
            }`}
          >
            {/* Badge Phổ biến */}
            {pkg.isPopular && (
              <Badge className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground font-medium rounded-full shadow-sm z-10">
                Phổ biến nhất
              </Badge>
            )}

            {/* Header thông tin gói */}
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-2xl font-bold text-foreground">
                {pkg.name}
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                {pkg.durationInMonths} Tháng • {pkg.sessions} Buổi
              </CardDescription>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(pkg.price)}
                </span>
              </div>
            </CardHeader>

            {/* Content chứa quyền lợi & chính sách coach */}
            <CardContent className="p-0 flex-1 space-y-6 py-4">
              <div className="space-y-3">
                <p className="font-semibold text-sm text-foreground">
                  Quyền lợi bao gồm:
                </p>
                <ul className="space-y-2.5">
                  {pkg.benefits.map((benefit, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2.5 text-sm text-slate-700"
                    >
                      <div className="p-0.5 rounded-full bg-primary/10 text-primary mt-0.5 shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="leading-tight">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5 pt-4 border-t border-slate-100">
                <p className="font-semibold text-sm text-foreground">
                  Chính sách Coach:
                </p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {pkg.coachPolicy}
                </p>
              </div>
            </CardContent>

            {/* Footer bấm đăng ký */}
            <CardFooter className="p-0 pt-4">
              <Button
                onClick={() => handleRegister(pkg.id)}
                className="w-full font-semibold h-11 text-sm rounded-xl transition-all"
                variant={pkg.isPopular ? "default" : "outline"}
              >
                Chọn gói này
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
