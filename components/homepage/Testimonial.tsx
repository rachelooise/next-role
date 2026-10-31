import Image from "next/image";
import type { ReactElement } from "react";

export function Testimonial(): ReactElement {
  return <section aria-labelledby="testimonial-title" className="flex min-h-[352px] flex-col items-center justify-center px-6 py-14 text-center lg:px-32">
    <h2 id="testimonial-title" className="text-xs font-semibold tracking-widest text-accent">SUCCESS STORIES</h2>
    <figure className="mt-6">
      <blockquote className="max-w-[900px] text-xl font-medium leading-[1.5] tracking-tight text-text-darker lg:text-[30px]">“I used to spend my evenings copy-pasting resumes. Now I open my dashboard to see interviews waiting. It feels like cheating. Had 3 offers on the table simultaneously.”</blockquote>
      <figcaption className="mt-6 flex items-center justify-center gap-3 text-left">
        <Image src="/images/user-icon.png" alt="" width={48} height={48} className="rounded-md" />
        <div><p className="text-sm font-semibold text-text-slate">Tom Wilson</p><p className="mt-1 text-sm text-text-secondary">Junior Developer</p></div>
      </figcaption>
    </figure>
  </section>;
}
