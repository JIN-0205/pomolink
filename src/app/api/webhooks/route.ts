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

  // // Do something with payload
  // // For this guide, log payload to console
  // const { id } = evt.data;
  // const eventType = evt.type;
  // console.log(`Received webhook with ID ${id} and event type of ${eventType}`);
  // console.log("Webhook payload:", body);

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const { id, email_addresses, first_name, image_url } = evt.data;
    const email = email_addresses[0].email_address;
    try {
      const newUser = await prisma.user.upsert({
        where: { email },
        update: {
          clerkId: id,
          name: first_name,
          imageUrl: image_url,
        },
        create: {
          clerkId: id,
          email,
          name: first_name,
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
      await prisma.user.delete({
        where: { clerkId: id },
      });
      return new Response("User deleted successfully", { status: 200 });
    } catch (err) {
      console.error("Error deleting user:", err);
      return new Response("Error deleting user", { status: 500 });
    }
  }

  return new Response("Webhook received", { status: 200 });
}
