import bcrypt from "bcrypt";

async function generatePasswordHash(password) {
  // const salt = await bcrypt.genSalt(10);
  const salt = '$2b$10$568W/2EgXKpmQc78Gr8doe'
  console.log(salt);

  const hash = await bcrypt.hash(password, salt);
  console.log("Hashed password:", hash);
}

generatePasswordHash("your_password");
