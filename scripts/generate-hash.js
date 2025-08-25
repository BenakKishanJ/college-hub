import bcrypt from "bcryptjs";

const saltRounds = 10;
const secretCode = "IamDraitian";

bcrypt.hash(secretCode, saltRounds, function(err, hash) {
  if (err) {
    console.error("Error generating hash:", err);
    return;
  }
  console.log("Hashed secret code:", hash);
});
