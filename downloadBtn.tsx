'use client';

import { useState } from 'react';
import { Button, ButtonProps, Text } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';

type DownloadButtonProps = {
  /** API endpoint returning ArrayBuffer */
  url: string;

  /** Default filename if server does not send Content-Disposition */
  filename?: string;

  /** Button label */
  label?: string;

  /** Optional callback when download starts */
  onStart?: () => void;

  /** Optional callback when download succeeds */
  onSuccess?: () => void;

  /** Optional callback when download fails */
  onError?: (error: Error) => void;
} & Omit<ButtonProps, 'onClick'>;

export function DownloadButton({
  url,
  filename = 'downloaded-file',
  label = 'Download',
  onStart,
  onSuccess,
  onError,
  ...buttonProps
}: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError(null);
      onStart?.();

      const res = await fetch(url, { method: 'GET' });

      if (!res.ok) {
        throw new Error(`Download failed (${res.status})`);
      }

      const arrayBuffer = await res.arrayBuffer();

      const blob = new Blob([arrayBuffer], {
        type:
          res.headers.get('content-type') ||
          'application/octet-stream',
      });

      // Extract filename from Content-Disposition if available
      const disposition = res.headers.get('content-disposition');
      const serverFilename =
        disposition?.match(/filename="?(.+)"?/)?.[1];

      const finalFilename = serverFilename || filename;

      const objectUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(objectUrl);

      onSuccess?.();
    } catch (err) {
      const errorObj =
        err instanceof Error ? err : new Error('Unknown error');

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
        disabled={downloading}
        onClick={handleDownload}
        {...buttonProps}
      >
        {label}
      </Button>

      {error && (
        <Text size="xs" c="red" mt={4}>
          {error}
        </Text>
      )}
    </>
  );
}
