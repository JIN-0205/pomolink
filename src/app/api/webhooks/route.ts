import prisma from "@/lib/db";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Webhook } from "svix";

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    throw new Error(
      "Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env"
    );
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET);

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", {
      status: 400,
    });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error: Could not verify webhook:", err);
    return new Response("Error: Verification error", {
      status: 400,
    });
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const { id, email_addresses = [], first_name, last_name, image_url } =
      evt.data;
    const primaryEmail = email_addresses.find(
      (address) => address.id === evt.data.primary_email_address_id
    );
    const fallbackEmail = email_addresses[0];
    const email = primaryEmail?.email_address || fallbackEmail?.email_address;

    if (!email) {
      console.error(
        "[CLERK_WEBHOOK] user event missing email address",
        JSON.stringify(evt.data)
      );
      return new Response("Missing email", { status: 400 });
    }

    const fullName =
      first_name || last_name ? `${first_name ?? ""} ${last_name ?? ""}`.trim() : null;
    try {
      const newUser = await prisma.user.upsert({
        where: { email },
        update: {
          clerkId: id,
          name: fullName,
          imageUrl: image_url,
        },
        create: {
          clerkId: id,
          email,
          name: fullName,
          imageUrl: image_url,
        },
      });
      return new Response(JSON.stringify(newUser), {
        status: 201,
      });
    } catch (err) {
      console.error("Error upserting user:", err);
      return new Response("Error upserting user", { status: 500 });
    }
  }

  if (evt.type === "user.deleted") {
    const { id } = evt.data;
    try {
      // まずユーザーが存在するかチェック
      const existingUser = await prisma.user.findUnique({
        where: { clerkId: id },
      });

      if (!existingUser) {
        console.log(`User with clerkId ${id} not found, already deleted`);
        return new Response("User not found (already deleted)", {
          status: 200,
        });
      }

      // ユーザーが存在する場合のみ削除を実行
      await prisma.user.delete({
        where: { clerkId: id },
      });

      console.log(`User with clerkId ${id} deleted successfully`);
      return new Response("User deleted successfully", { status: 200 });
    } catch (err) {
      console.error("Error deleting user:", err);

      // P2025エラー（レコードが見つからない）の場合は正常終了
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "P2025"
      ) {
        console.log(`User with clerkId ${id} already deleted`);
        return new Response("User already deleted", { status: 200 });
      }

      return new Response("Error deleting user", { status: 500 });
    }
  }

  return new Response("Webhook received", { status: 200 });
}
