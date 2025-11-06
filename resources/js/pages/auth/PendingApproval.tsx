import { useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import { Modal, ModalContent } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export default function PendingApproval() {
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       router.post("/logout"); // auto logout after few seconds
//     }, 7000);
//     return () => clearTimeout(timer);
//   }, []);

  return (
    <>
      <Head title="Pending Approval" />
      <Modal defaultOpen>
        <ModalContent className="p-6 text-center space-y-4">
          <h2 className="text-xl font-semibold">⏳ Waiting for Admin Approval</h2>
          <p className="text-sm text-muted-foreground">
            Your registration request has been submitted.
            <br />
            Please wait while the admin reviews your account.
          </p>
          <p className="text-xs text-gray-500">
            You will be logged out automatically and notified once approved.
          </p>
          <Button
            variant="outline"
            onClick={() => router.post("/logout")}
          >
            Logout now
          </Button>
        </ModalContent>
      </Modal>
    </>
  );
}
