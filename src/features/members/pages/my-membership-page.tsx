import React, { useState } from "react";
import { MembershipCard } from "../components/membership-card";
import { BenefitsCard } from "../components/benefits-card";
import { InvoiceHistoryCard } from "../components/invoice-history-card";
import { ConfirmDialog } from "@/components/common/confirm-dialog";

export const MyMembershipPage: React.FC = () => {
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);

  const handleRenew = () => {
    setIsRenewModalOpen(true);
  };

  const handleConfirmRenew = () => {
    setIsRenewModalOpen(false);
    alert("Yêu cầu gia hạn/nâng cấp gói hội viên đã được gửi tới tư vấn viên!");
  };

  return (
    <div className="space-y-6">
      {/* Top Grid: Left Membership Status Card (60%) + Right Benefits Card (40%) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <MembershipCard
            cardName="Platinum Elite Card"
            cardNumber="MINT-CARD-8849"
            statusLabel="ĐANG HOẠT ĐỘNG"
            memberSince="12/12/2025"
            daysRemaining={185}
            progressPercent={65}
            ptUsed={12}
            ptTotal={24}
            groupXClasses={16}
          />
        </div>
        <div className="lg:col-span-5">
          <BenefitsCard
            title="Quyền lợi của bạn"
            benefits={[
              "Không giới hạn thời gian tập luyện tự do",
              "Sử dụng phòng tắm, phòng xông hơi, bể bơi",
              "Đầy đủ 24 buổi tập cá nhân 1-kèm-1",
              "Ưu tiên đặt lớp Yoga và GroupX sớm nhất",
            ]}
            actionLabel="Gia hạn / Nâng cấp thành viên"
            onActionClick={handleRenew}
          />
        </div>
      </div>

      {/* Bottom Section: Invoice & Payment History */}
      <div>
        <InvoiceHistoryCard
          title="Lịch sử thanh toán & hóa đơn"
          invoices={[
            {
              id: "1",
              code: "#INV-94021",
              transactionDate: "12/12/2025",
              servicePackage: "Elite Wellness Platinum",
              amount: "11.000.000đ",
              status: "COMPLETED",
              statusLabel: "Hoàn thành",
            },
            {
              id: "2",
              code: "#INV-38491",
              transactionDate: "15/08/2025",
              servicePackage: "Mint Basic 12 Buổi PT",
              amount: "6.000.000đ",
              status: "COMPLETED",
              statusLabel: "Hoàn thành",
            },
          ]}
        />
      </div>

      {/* Renewal Confirmation Dialog */}
      <ConfirmDialog
        open={isRenewModalOpen}
        onOpenChange={setIsRenewModalOpen}
        title="Gia hạn / Nâng cấp gói hội viên"
        description="Bạn có muốn đăng ký nâng cấp hoặc gia hạn thêm thời hạn cho thẻ Platinum Elite Card không? Chuyên viên tư vấn sẽ liên hệ hỗ trợ bạn trong ít phút."
        confirmText="Đồng ý gia hạn"
        cancelText="Để sau"
        onConfirm={handleConfirmRenew}
      />
    </div>
  );
};
