import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import type { CertificateLink } from "../../types/certificateLink";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  link: CertificateLink | null;
  url: string | null;
}

/**
 * Share panel for an active certificate link.
 *
 * The QR matters here for the same reason it does on payment links: these get shown on a screen at
 * the end of a webinar, and attendees claim from their phones while it is still up.
 */
export default function CertificateLinkShareModal({ isOpen, onClose, link, url }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !url) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(url, { width: 640, margin: 2, errorCorrectionLevel: "M" })
      .then((data) => {
        if (!cancelled) setQrDataUrl(data);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, url]);

  useEffect(() => {
    if (!isOpen) setCopied(false);
  }, [isOpen]);

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked outside a secure context — the input below is selectable.
      setCopied(false);
    }
  };

  const fileName = `certificate-link-${link?.id || "qr"}.png`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6">
      <h4 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
        Share this certificate link
      </h4>
      <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">{link?.title}</p>

      {url ? (
        <>
          <div className="flex justify-center rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Certificate link QR code" className="h-56 w-56" />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center text-sm text-gray-400">
                Generating QR…
              </div>
            )}
          </div>

          <div className="mt-4">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>

          <p className="mt-3 text-xs text-gray-400">
            Anyone with this URL can claim a certificate — there is no login and no verification.
            Share it with the audience it was made for.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" onClick={handleCopy}>
              {copied ? "Copied" : "Copy link"}
            </Button>
            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={fileName}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
              >
                Download QR
              </a>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This link is not active, so it has no working public page yet. Set its status to Active
          (and check the expiry date) before sharing it.
        </p>
      )}
    </Modal>
  );
}
