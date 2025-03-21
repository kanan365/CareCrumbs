import { connectToDatabase } from "../../../lib/mongodb";
import formidable from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  // Create upload directory if not exists
  const uploadDir = path.join(process.cwd(), "public/uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = formidable({
    uploadDir: uploadDir,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024 // 5MB max file size
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form Parse Error:", err);
      return res.status(500).json({ message: "File upload error" });
    }

    // Log parsed fields and files for debugging
    console.log("Parsed Fields:", fields);
    console.log("Parsed Files:", files);

    const { name, email, mobile, password } = fields;

    // Validation
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    try {
      const { db } = await connectToDatabase();
      const usersCollection = db.collection("users");

      // Check existing user
      const existingUser = await usersCollection.findOne({
        $or: [
          { email: email[0] || email }, 
          { mobile: mobile[0] || mobile }
        ],
      });

      if (existingUser) {
        return res.status(400).json({ message: "User already exists!" });
      }

      // Handle profile image upload
      let profileImagePath = null;
      if (files.profileImage && files.profileImage.length > 0) {
        const file = files.profileImage[0];

        if (file.originalFilename) {
          const fileName = `profile_${Date.now()}${path.extname(file.originalFilename)}`;
          const newPath = path.join(uploadDir, fileName);

          // Move file
          fs.copyFileSync(file.filepath, newPath);
          profileImagePath = `/uploads/${fileName}`;
        }
      }

      // Store plain text password (removed bcrypt hashing)
      const plainPassword = String(password[0] || password);

      // Insert user with lastLogin field
      const result = await usersCollection.insertOne({
        name: name[0] || name, // Handle potential array or string
        email: email[0] || email,
        mobile: mobile[0] || mobile,
        password: plainPassword, // Store plain text password
        profileImage: profileImagePath,
        lastLogin: new Date(),
        createdAt: new Date()
      });

      return res.status(201).json({
        message: "User registered successfully",
        userId: result.insertedId,
        profileImage: profileImagePath
      });
    } catch (error) {
      console.error("Detailed Signup Error:", error);
      return res.status(500).json({
        message: "Internal server error",
        errorDetails: error.message
      });
    }
  });
}