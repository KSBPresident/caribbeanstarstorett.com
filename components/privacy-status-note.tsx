import Link from "next/link";

export function PrivacyStatusNote({ submittedData }: { submittedData: string }) {
  return (
    <p className="identity-message" role="note">
      <strong>Privacy notice in progress.</strong> {submittedData} The current{" "}
      <Link href="/privacy">privacy notice</Link> advises visitors not to submit
      personal or sensitive information while the full notice is being prepared.
      You can wait to submit until the complete notice is available.
    </p>
  );
}
