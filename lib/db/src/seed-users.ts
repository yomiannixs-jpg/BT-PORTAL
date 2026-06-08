import bcrypt from "bcryptjs";
import { db } from "./index";
import { usersTable } from "./schema/users";

async function main() {
  const users = [
    { email: "admin@baumtenpers.com", password: "admin123", role: "admin" as const, name: "Portal Administrator", studentId: null },
    { email: "amara.mensah@example.com", password: "student1", role: "student" as const, name: "Amara Mensah", studentId: 1 },
    { email: "fatima.ibrahim@example.com", password: "student2", role: "student" as const, name: "Fatima Ibrahim", studentId: 2 },
    { email: "khoury.benaissa@example.com", password: "student3", role: "student" as const, name: "Khoury Benaissa", studentId: 3 },
  ];
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const result = await db.insert(usersTable).values({
      email: u.email,
      passwordHash,
      role: u.role,
      name: u.name,
      studentId: u.studentId,
    }).onConflictDoNothing().returning();
    if (result.length > 0) {
      console.log(`✓ Created: ${u.email} (${u.role})`);
    } else {
      console.log(`- Skipped (exists): ${u.email}`);
    }
  }
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
