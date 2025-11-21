import { config } from "dotenv"

config({ path: ".env.local" })
config()

async function main() {
  const { adminAuth } = await import("@/lib/firebase-admin")
  const targetEmail = process.env.ADMIN_SEED_EMAIL

  if (!targetEmail) {
    console.error("Missing ADMIN_SEED_EMAIL in environment")
    process.exit(1)
  }

  try {
    const userRecord = await adminAuth.getUserByEmail(targetEmail)
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: "admin" })
    console.log(`Admin role assigned to ${targetEmail}`)
  } catch (error) {
    console.error("Failed to assign admin role", error)
    process.exit(1)
  }
}

main()
