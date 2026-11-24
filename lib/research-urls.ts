import { lookup } from "node:dns/promises";
import { isIP, type LookupFunction } from "node:net";
import { Agent, fetch as safeFetch } from "undici";
import { parse } from "tldts";

const JOB_HOSTS = new Set(["adzuna.com", "adzuna.co.uk", "adzuna.com.au", "adzuna.ca", "greenhouse.io", "greenhouse.com", "lever.co", "ashbyhq.com", "myworkdayjobs.com", "workday.com", "smartrecruiters.com", "workable.com", "icims.com", "jobvite.com", "bamboohr.com", "indeed.com", "linkedin.com", "seek.com.au", "tal.net", "applytojob.com", "successfactors.com"]);

export function publicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split(".").map(Number);
    return a > 0 && a < 224 && a !== 10 && a !== 127 && !(a === 100 && b >= 64 && b <= 127)
      && !(a === 169 && b === 254) && !(a === 172 && b >= 16 && b <= 31)
      && !(a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99)))
      && !(a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100)))
      && !(a === 203 && b === 0 && c === 113);
  }
  // Only ordinary global IPv6 unicast; reject mapped IPv4 and transition ranges.
  return isIP(address) === 6 && /^[23]/i.test(address) && !/^200[12]:/i.test(address);
}

export function researchUrl(value: string, base?: string): URL {
  if (value.length > 2048) throw new Error("Invalid research URL");
  const url = new URL(value, base);
  const host = parse(url.hostname, { allowPrivateDomains: true });
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || !host.domain || !host.isIcann || host.isIp || url.hostname.endsWith(".")) {
    throw new Error("Invalid research URL");
  }
  url.hash = "";
  return url;
}

export function companyDomain(value: string): string | null {
  try { return parse(researchUrl(value).hostname, { allowPrivateDomains: true }).domain; } catch { return null; }
}

export function isJobHost(value: string): boolean {
  try {
    const host = researchUrl(value).hostname;
    return [...JOB_HOSTS].some(domain => host === domain || host.endsWith(`.${domain}`));
  } catch { return true; }
}

export async function assertPublicHost(url: URL): Promise<void> {
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(item => !publicAddress(item.address))) throw new Error("Nonpublic research host");
}

const guardedLookup: LookupFunction = (hostname, options, callback): void => {
  lookup(hostname, { all: true }).then(addresses => {
    if (!addresses.length || addresses.some(item => !publicAddress(item.address))) return callback(new Error("Nonpublic research host"), "");
    const eligible = options.family ? addresses.filter(item => item.family === options.family) : addresses;
    if (!eligible.length) return callback(new Error("Research DNS unavailable"), "");
    if (options.all) callback(null, eligible);
    else callback(null, eligible[0].address, eligible[0].family);
  }).catch(() => callback(new Error("Research DNS unavailable"), ""));
};

export async function resolveResearchRedirect(value: string): Promise<URL> {
  const dispatcher = new Agent({ connect: { lookup: guardedLookup, timeout: 6000 } });
  const signal = AbortSignal.timeout(10000);
  try {
    let url = researchUrl(value);
    for (let hop = 0; hop < 6; hop++) {
      const response = await safeFetch(url, { dispatcher, redirect: "manual", signal, headers: { "User-Agent": "NextRole Company Research" } });
      await response.body?.cancel();
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const next = response.headers.get("location");
        if (!next) throw new Error("Missing redirect destination");
        url = researchUrl(next, url.href);
        continue;
      }
      if (!response.ok) throw new Error("Research posting unavailable");
      return url;
    }
    throw new Error("Too many research redirects");
  } finally {
    await dispatcher.destroy();
  }
}
