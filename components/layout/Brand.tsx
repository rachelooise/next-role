import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";

export function Brand(): ReactElement {
  return <Link href="/" aria-label="NextRole home" className="inline-flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
    <span aria-hidden="true" className="block size-10 overflow-hidden">
      <Image src="/logo.png" alt="" width={500} height={168} className="h-10 w-auto max-w-none" />
    </span>
    <span className="text-2xl font-bold tracking-tight text-text-darkest">NextRole</span>
  </Link>;
}
