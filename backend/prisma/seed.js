import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Clean existing data
  await prisma.playoff.deleteMany();
  await prisma.match.deleteMany();
  await prisma.pointsTable.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleaned existing data");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@cricket.com",
      password: hashedPassword,
      role: "admin",
    },
  });
  console.log("Created admin user:", admin.email);

  // Create viewer user
  const viewerPassword = await bcrypt.hash("viewer123", 10);
  const viewer = await prisma.user.create({
    data: {
      email: "viewer@cricket.com",
      password: viewerPassword,
      role: "viewer",
    },
  });
  console.log("Created viewer user:", viewer.email);

  // Create 6 teams
  const teamsData = [
    {
      name: "Royal Challengers",
      logo: "https://cdn-icons-png.flaticon.com/512/862/862808.png",
    },
    {
      name: "Mumbai Indians",
      logo: "https://cdn-icons-png.flaticon.com/512/862/862808.png",
    },
    {
      name: "Chennai Kings",
      logo: "https://cdn-icons-png.flaticon.com/512/862/862808.png",
    },
    {
      name: "Kolkata Riders",
      logo: "https://cdn-icons-png.flaticon.com/512/862/862808.png",
    },
    {
      name: "Delhi Capitals",
      logo: "https://cdn-icons-png.flaticon.com/512/862/862808.png",
    },
    {
      name: "Punjab Kings",
      logo: "https://cdn-icons-png.flaticon.com/512/862/862808.png",
    },
  ];

  const teams = [];
  for (const teamData of teamsData) {
    const team = await prisma.team.create({
      data: teamData,
    });
    teams.push(team);

    // Create points table entry
    await prisma.pointsTable.create({
      data: {
        teamId: team.id,
      },
    });
  }
  console.log("Created", teams.length, "teams");

  // Add players to each team
  const playersData = [
    // Royal Challengers
    { name: "Virat Kohli", teamId: teams[0].id },
    { name: "AB de Villiers", teamId: teams[0].id },
    { name: "Glenn Maxwell", teamId: teams[0].id },
    { name: "Mohammed Siraj", teamId: teams[0].id },
    { name: "Yuzvendra Chahal", teamId: teams[0].id },
    // Mumbai Indians
    { name: "Rohit Sharma", teamId: teams[1].id },
    { name: "Jasprit Bumrah", teamId: teams[1].id },
    { name: "Hardik Pandya", teamId: teams[1].id },
    { name: "Surya Kumar Yadav", teamId: teams[1].id },
    { name: "Rahul Buddh", teamId: teams[1].id },
    // Chennai Kings
    { name: "MS Dhoni", teamId: teams[2].id },
    { name: "Ravindra Jadeja", teamId: teams[2].id },
    { name: "Faf du Plessis", teamId: teams[2].id },
    { name: "Deepak Chahar", teamId: teams[2].id },
    { name: "Ambati Rayudu", teamId: teams[2].id },
    // Kolkata Riders
    { name: "Shreyas Iyer", teamId: teams[3].id },
    { name: "Andre Russell", teamId: teams[3].id },
    { name: "Sunil Narine", teamId: teams[3].id },
    { name: "Varun Chakravarthy", teamId: teams[3].id },
    { name: "Pat Cummins", teamId: teams[3].id },
    // Delhi Capitals
    { name: "Rishabh Pant", teamId: teams[4].id },
    { name: "David Warner", teamId: teams[4].id },
    { name: "Kuldeep Yadav", teamId: teams[4].id },
    { name: "Anrich Nortje", teamId: teams[4].id },
    { name: "Axar Patel", teamId: teams[4].id },
    // Punjab Kings
    { name: "Shikhar Dhawan", teamId: teams[5].id },
    { name: "Kagiso Rabada", teamId: teams[5].id },
    { name: "Sam Curran", teamId: teams[5].id },
    { name: "Harpreet Brar", teamId: teams[5].id },
    { name: "Liam Livingstone", teamId: teams[5].id },
  ];

  for (const playerData of playersData) {
    await prisma.player.create({
      data: playerData,
    });
  }
  console.log("Created", playersData.length, "players");

  // Generate fixtures (round-robin)
  const n = teams.length;
  const matches = [];
  const start = new Date("2026-04-01");

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const matchIndex = matches.length;
      const matchDate = new Date(start);
      matchDate.setDate(matchDate.getDate() + Math.floor(matchIndex / 3));

      matches.push({
        team1Id: teams[i].id,
        team2Id: teams[j].id,
        matchDate,
        matchTime: "14:00",
        venue: "Stadium",
        status: "scheduled",
        round: "league",
      });
    }
  }

  await prisma.match.createMany({
    data: matches,
  });
  console.log("Created", matches.length, "fixtures");

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
