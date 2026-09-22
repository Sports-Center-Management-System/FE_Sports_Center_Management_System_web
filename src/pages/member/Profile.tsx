import React, { useState } from "react";
import { mockProfileData } from "@/mocks/memberData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Heart,
  Target,
  Save,
  Activity,
  ShieldCheck,
  Dumbbell,
  Camera,
} from "lucide-react";

export const Profile: React.FC = () => {
  const [personal, setPersonal] = useState(mockProfileData.personalInfo);
  const [physical, setPhysical] = useState(mockProfileData.physicalInfo);

  const handleSave = () => {
    alert("Đã lưu thông tin hồ sơ thành công!");
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 space-y-6">
      {/* 1. HERO BANNER HEADER */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 w-full md:w-auto">
          <div className="relative shrink-0">
            <img
              src={personal.avatarUrl}
              alt={personal.fullName}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-emerald-500/10"
            />
            <button className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full shadow-md hover:bg-primary/90 transition-all">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">
                {personal.fullName}
              </h1>
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-medium">
                {mockProfileData.membershipSummary.status}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-2 flex-wrap">
              <ShieldCheck className="w-4 h-4 text-primary" /> Mã hội viên:{" "}
              <span className="font-semibold text-slate-700">
                {personal.memberId}
              </span>
              <span>•</span>
              Tham gia: {personal.joinDate}
            </p>
          </div>
        </div>

        <Button
          onClick={handleSave}
          className="w-full md:w-auto gap-2 rounded-xl h-11 font-semibold px-6 shadow-sm shrink-0"
        >
          <Save className="w-4 h-4" /> Lưu thông tin
        </Button>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white p-4 rounded-xl border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium truncate">
                Chiều cao / Cân nặng
              </p>
              <p className="text-base font-bold text-slate-800">
                {physical.height} cm / {physical.weight} kg
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-white p-4 rounded-xl border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium truncate">
                Chỉ số BMI
              </p>
              <p className="text-base font-bold text-slate-800">
                {physical.bmi}{" "}
                <span className="text-xs text-emerald-600 font-normal">
                  (Bình thường)
                </span>
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-white p-4 rounded-xl border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium truncate">
                Buổi tập còn lại
              </p>
              <p className="text-base font-bold text-slate-800">
                {mockProfileData.membershipSummary.remainingSessions} /{" "}
                {mockProfileData.membershipSummary.totalSessions}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-white p-4 rounded-xl border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium truncate">
                Hạn gói tập
              </p>
              <p className="text-base font-bold text-slate-800">
                {mockProfileData.membershipSummary.expireDate}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. FORM INPUT DETAIL */}
      <Tabs defaultValue="personal" className="w-full block">
        <TabsList className="w-full grid grid-cols-2 p-1 bg-slate-200/80 rounded-xl h-12 mb-6">
          <TabsTrigger
            value="personal"
            className="rounded-lg font-semibold text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Thông tin cá nhân & Liên hệ
          </TabsTrigger>
          <TabsTrigger
            value="physical"
            className="rounded-lg font-semibold text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Thể chất & Mục tiêu tập luyện
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: THÔNG TIN CÁ NHÂN */}
        <TabsContent value="personal" className="w-full block">
          <Card className="bg-white rounded-2xl border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="p-6 pb-4 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-slate-800">
                Thông tin cơ bản
              </CardTitle>
              <CardDescription>
                Quản lý và cập nhật thông tin cá nhân của bạn
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="fullname"
                    className="text-xs font-semibold text-slate-600"
                  >
                    Họ và tên
                  </Label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <Input
                      id="fullname"
                      className="pl-9 h-10 rounded-xl"
                      value={personal.fullName}
                      onChange={(e) =>
                        setPersonal({ ...personal, fullName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="phone"
                    className="text-xs font-semibold text-slate-600"
                  >
                    Số điện thoại
                  </Label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <Input
                      id="phone"
                      className="pl-9 h-10 rounded-xl"
                      value={personal.phone}
                      onChange={(e) =>
                        setPersonal({ ...personal, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-xs font-semibold text-slate-600"
                  >
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-9 h-10 rounded-xl"
                      value={personal.email}
                      onChange={(e) =>
                        setPersonal({ ...personal, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="dob"
                    className="text-xs font-semibold text-slate-600"
                  >
                    Ngày sinh
                  </Label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <Input
                      id="dob"
                      type="date"
                      className="pl-9 h-10 rounded-xl"
                      value={personal.dob}
                      onChange={(e) =>
                        setPersonal({ ...personal, dob: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <Label
                  htmlFor="address"
                  className="text-xs font-semibold text-slate-600"
                >
                  Địa chỉ liên hệ
                </Label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    id="address"
                    className="pl-9 h-10 rounded-xl"
                    value={personal.address}
                    onChange={(e) =>
                      setPersonal({ ...personal, address: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: THỂ CHẤT & MỤC TIÊU */}
        <TabsContent value="physical" className="w-full block">
          <Card className="bg-white rounded-2xl border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="p-6 pb-4 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-slate-800">
                Thông tin thể chất
              </CardTitle>
              <CardDescription>
                Cung cấp chỉ số để HLV theo dõi lộ trình tập luyện tốt nhất
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="height"
                    className="text-xs font-semibold text-slate-600"
                  >
                    Chiều cao (cm)
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    className="h-10 rounded-xl"
                    value={physical.height}
                    onChange={(e) =>
                      setPhysical({
                        ...physical,
                        height: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="weight"
                    className="text-xs font-semibold text-slate-600"
                  >
                    Cân nặng (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    className="h-10 rounded-xl"
                    value={physical.weight}
                    onChange={(e) =>
                      setPhysical({
                        ...physical,
                        weight: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="freq"
                    className="text-xs font-semibold text-slate-600"
                  >
                    Tần suất tập luyện
                  </Label>
                  <Input
                    id="freq"
                    className="h-10 rounded-xl"
                    value={physical.workoutFrequency}
                    onChange={(e) =>
                      setPhysical({
                        ...physical,
                        workoutFrequency: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <Label
                  htmlFor="goal"
                  className="text-xs font-semibold text-slate-600"
                >
                  Mục tiêu cá nhân
                </Label>
                <div className="relative">
                  <Target className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    id="goal"
                    className="pl-9 h-10 rounded-xl"
                    value={physical.targetGoal}
                    onChange={(e) =>
                      setPhysical({ ...physical, targetGoal: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <Label
                  htmlFor="medical"
                  className="text-xs font-semibold text-slate-600"
                >
                  Ghi chú y tế / Tiền sử sức khỏe
                </Label>
                <div className="relative">
                  <Heart className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    id="medical"
                    className="pl-9 h-10 rounded-xl"
                    value={physical.medicalNotes}
                    onChange={(e) =>
                      setPhysical({ ...physical, medicalNotes: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
