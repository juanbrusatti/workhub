import { config } from "dotenv"

config({ path: ".env.local" })
config()

async function main() {
  const { adminAuth } = await import("@/lib/firebase-admin")

  const seedEmail = process.env.ADMIN_SEED_EMAIL
  const seedPassword = process.env.ADMIN_SEED_PASSWORD

  if (!seedEmail || !seedPassword) {
    console.warn("Skipping admin seed: ADMIN_SEED_EMAIL or ADMIN_SEED_PASSWORD not set")
    return
  }

  let existingUser
  try {
    existingUser = await adminAuth.getUserByEmail(seedEmail)
    console.log("Admin seed user already exists")
  } catch (error: any) {
    if (error?.code === "auth/user-not-found") {
      const userRecord = await adminAuth.createUser({ email: seedEmail, password: seedPassword })
      await adminAuth.setCustomUserClaims(userRecord.uid, { role: "admin" })
      console.log(`Admin seed user created for ${seedEmail}`)
      return
    }
    throw error
  }

  const userRecord = existingUser ?? (await adminAuth.getUserByEmail(seedEmail))

  const updates: Parameters<typeof adminAuth.updateUser>[1] = {}
  if (seedPassword) {
    updates.password = seedPassword
  }
  if (userRecord.disabled) {
    updates.disabled = false
  }

  if (Object.keys(updates).length > 0) {
    await adminAuth.updateUser(userRecord.uid, updates)
    console.log("Admin seed user credentials refreshed")
  }

  if (userRecord.customClaims?.role !== "admin") {
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: "admin" })
    console.log("Admin role ensured for seed user")
  }
}

main().catch((error) => {
  console.error("Failed to ensure admin user", error)
  process.exit(1)
})
