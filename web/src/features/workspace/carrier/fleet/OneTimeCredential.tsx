import { useState } from "react";
import { Button } from "@/components/ui/button";

export function OneTimeCredential({ password, onClose }: { password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [copyProblem, setCopyProblem] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setCopyProblem(false);
    } catch {
      setCopyProblem(true);
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-line bg-canvas p-4" aria-live="polite">
      <h2 className="text-base font-bold text-ink">Mật khẩu tạm chỉ hiện một lần</h2>
      <p className="text-sm leading-relaxed text-ink">Hãy chuyển mật khẩu này cho tài xế qua kênh riêng. Sau khi đóng hoặc rời trang, hệ thống không hiện lại và không lưu trên trình duyệt.</p>
      <p className="break-all rounded-xl border border-line bg-surface px-3 py-3 font-mono text-sm text-navy">{password}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => void copy()}>{copied ? "Đã chép" : "Chép mật khẩu"}</Button>
        <Button type="button" onClick={onClose}>Đã giao cho tài xế</Button>
      </div>
      {copyProblem ? <p className="text-sm text-ink">Không chép tự động được. Hãy chọn và chép dòng mật khẩu ở trên.</p> : null}
    </section>
  );
}
