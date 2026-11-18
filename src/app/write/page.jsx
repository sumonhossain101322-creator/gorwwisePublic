import { Suspense } from "react";
import WriteEditor from "./WriteEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Write",
  robots: { index: false, follow: false },
};

export default function WritePage() {
  return (
    <Suspense fallback={<p>Loading the editor...</p>}>
      <WriteEditor />
    </Suspense>
  );
}
