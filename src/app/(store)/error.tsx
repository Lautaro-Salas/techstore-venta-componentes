"use client";

import { ErrorView } from "@/components/feedback/error-view";

export default function StoreError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorView retry={retry} digest={error.digest} />;
}
