import { EmailTemplate } from "@/components/email/EmailTemplate";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  try {
    const { data, error } = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: ["jin.nakano.canada@gmail.com"],
      subject: "Hello world",
      react: await EmailTemplate({
        firstName: "John",
        inviterName: "Jane",
        projectName: "Example Project",
        inviteLink: "https://example.com/invite",
      }),
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
