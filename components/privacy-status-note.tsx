import Link from "next/link";

export function PrivacyStatusNote({ submittedData }: { submittedData: string }) {
  return (
    <p className="identity-message" role="note">
      <strong>Interim privacy information.</strong> {submittedData} Read the{" "}
      <Link href="/privacy">privacy information</Link> and provide only the details requested by this form.
    </p>
  );
}
