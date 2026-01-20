"use client";

import { useState } from "react";
import { Button, ButtonProps, Text } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { useAuth } from "@/hooks/useAuth"; // chỉnh path cho đúng project

type DownloadButtonProps = {
  /** API endpoint returning ArrayBuffer */
  url: string;

  /** Default filename if server does not send Content-Disposition */
  filename?: string;

  /** Button label */
  label?: string;

  onStart?: () => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
} & Omit<ButtonProps, "onClick">;

export function DownloadButton({
  url,
  filename = "downloaded-file",
  label = "Download",
  onStart,
  onSuccess,
  onError,
  ...buttonProps
}: DownloadButtonProps) {
  const { idToken } = useAuth(); // 👈 lấy token từ auth
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPermission = Boolean(idToken);

  const handleDownload = async () => {
    if (!idToken) {
      setError("Không có quyền tải file");
      return;
    }

    try {
      setDownloading(true);
      setError(null);
      onStart?.();

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Không có quyền truy cập");
        }
        throw new Error(`Download failed (${res.status})`);
      }

      const arrayBuffer = await res.arrayBuffer();

      const blob = new Blob([arrayBuffer], {
        type: res.headers.get("content-type") || "application/octet-stream",
      });

      const disposition = res.headers.get("content-disposition");
      const serverFilename = disposition?.match(/filename="?(.+)"?/)?.[1];

      const finalFilename = serverFilename || filename;

      const objectUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(objectUrl);

      onSuccess?.();
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Unknown error");

      setError(errorObj.message);
      onError?.(errorObj);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Button
        leftSection={<IconDownload size={16} />}
        loading={downloading}
        disabled={!hasPermission || downloading}
        onClick={handleDownload}
        {...buttonProps}
      >
        {label}
      </Button>

      {!hasPermission && (
        <Text size="xs" c="dimmed" mt={4}>
          Không có quyền
        </Text>
      )}

      {error && (
        <Text size="xs" c="red" mt={4}>
          {error}
        </Text>
      )}
    </>
  );
}
