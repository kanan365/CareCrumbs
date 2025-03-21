import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false, // This is required for file uploads
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Parse the form with a Promise wrapper to ensure response is sent
    const form = new IncomingForm({
      uploadDir: uploadDir,
      keepExtensions: true,
    });
    
    // Use a promise to handle the form parsing
    const formData = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ fields, files });
      });
    });
    
    const { files } = formData;
    
    if (!files || !files.image || files.image.length === 0) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    const imageFile = files.image[0]; // In newer formidable versions, this is an array
    
    // Get the new file path
    const fileName = path.basename(imageFile.filepath);
    const imageUrl = `/uploads/${fileName}`;
    
    return res.status(200).json({ imageUrl });
    
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: 'Server error during upload' });
  }
}