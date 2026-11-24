import "server-only";
import path from "node:path";
import { Document, Page, Text, View, Font, renderToBuffer } from "@react-pdf/renderer";
import { PDFParse } from "pdf-parse";
import type { ReactElement } from "react";
import type { ProfileInput } from "@/lib/profile";
import type { ResumeContent } from "@/lib/resume-generation";

Font.register({ family: "Noto Sans", fonts: [
  { src: path.join(process.cwd(), "public/fonts/NotoSans-Regular.ttf"), fontWeight: 400 },
  { src: path.join(process.cwd(), "public/fonts/NotoSans-Bold.ttf"), fontWeight: 700 },
] });

type Props = { profile: ProfileInput; email: string; content: ResumeContent; fontSize: number };

function formatMonth(value: string | null): string {
  if (!value) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  return match ? `${months[Number(match[2]) - 1]} ${match[1]}` : value;
}

export function ResumeDocument({ profile, email, content, fontSize }: Props): ReactElement {
  const heading = { fontSize: fontSize + 1, fontWeight: 700, marginTop: 12, marginBottom: 5 };
  return <Document title={`${profile.full_name} Resume`} author={profile.full_name ?? ""}>
    <Page size="A4" style={{ padding: 36, fontFamily: "Noto Sans", fontSize, lineHeight: 1.35 }}>
      <View wrap={false} style={{ marginBottom: 2 }}>
        <Text style={{ fontSize: 21, fontWeight: 700, lineHeight: 1.3, marginBottom: 6 }}>{profile.full_name}</Text>
        {profile.current_title && <Text style={{ fontSize: 12, lineHeight: 1.4, marginBottom: 6 }}>{profile.current_title}</Text>}
        <Text>{[email, profile.phone, profile.location].filter(Boolean).join(" | ")}</Text>
        {[profile.linkedin_url, profile.portfolio_url].filter(Boolean).map((url) => <Text key={url} style={{ marginTop: 3 }}>{url}</Text>)}
      </View>
      <Text style={heading}>Professional Summary</Text><Text>{content.summary}</Text>
      {profile.skills.length > 0 && <View><Text style={heading}>Skills</Text><Text>{profile.skills.join(" · ")}</Text></View>}
      {profile.work_experience.length > 0 && <Text style={heading}>Work Experience</Text>}
      {profile.work_experience.map((role, index) => <View key={index} style={{ marginBottom: 8 }}>
        <View wrap={false} style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <Text style={{ fontWeight: 700, flexGrow: 1, flexShrink: 1, flexBasis: 0 }}>{[role.job_title, role.company].filter(Boolean).join(" | ")}</Text>
          <Text style={{ width: 145, flexShrink: 0, marginLeft: 12, textAlign: "right" }}>{[formatMonth(role.start_date), role.is_current ? "Present" : formatMonth(role.end_date)].filter(Boolean).join(" - ")}</Text>
        </View>
        {content.roles[index].bullets.map((bullet, bulletIndex) => <Text key={bulletIndex} style={{ marginTop: 3 }}>• {bullet}</Text>)}
      </View>)}
      {profile.education && Object.values(profile.education).some(Boolean) && <View>
        <Text style={heading}>Education</Text>
        <Text>{[profile.education.degree, profile.education.field_of_study].filter(Boolean).join(", ")}</Text>
        <Text>{[profile.education.institution, profile.education.graduation_year].filter(Boolean).join(" | ")}</Text>
      </View>}
    </Page>
  </Document>;
}

export async function renderResumePdf(profile: ProfileInput, email: string, content: ResumeContent): Promise<Buffer> {
  for (const fontSize of [11, 10]) {
    const buffer = await renderToBuffer(<ResumeDocument profile={profile} email={email} content={content} fontSize={fontSize} />);
    const parser = new PDFParse({ data: new Uint8Array(buffer), isEvalSupported: false });
    try {
      const info = await parser.getInfo();
      if (info.total === 1) return buffer;
    } finally { await parser.destroy(); }
  }
  throw new Error("Your saved details need more than one page. Shorten long skills, links or role descriptions and try again. Your current resume is unchanged.");
}
