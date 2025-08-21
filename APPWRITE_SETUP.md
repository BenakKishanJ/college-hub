# Appwrite Setup Guide for College Hub

This guide will help you set up the Appwrite backend for the College Hub application.

## Prerequisites

1. Create an account at [Appwrite Cloud](https://cloud.appwrite.io) or set up a self-hosted Appwrite instance
2. Have your project running locally with the correct environment variables

## Step 1: Create a New Project

1. Go to the Appwrite Console
2. Click "Create Project"
3. Enter project name: `College Hub`
4. Note down your **Project ID** - you'll need this for your `.env` file

## Step 2: Configure Environment Variables

Create a `.env` file in your project root:

```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id_here
```

Replace `your_project_id_here` with your actual project ID from Step 1.

## Step 3: Add Platform

1. In your Appwrite project, go to "Overview"
2. Click "Add Platform"
3. Select "React Native App"
4. Add your app details:
   - **Name**: College Hub
   - **Package Name**: `com.example.collegehub` (or your actual package name)

## Step 4: Create Database

1. Go to "Databases" in the left sidebar
2. Click "Create Database"
3. Database ID: `college_hub_db`
4. Name: `College Hub Database`

## Step 5: Create Collections

### Collection 1: Users

1. Click "Create Collection"
2. Collection ID: `users`
3. Name: `Users`
4. **Permissions**:
   - Create: `role:member`
   - Read: `role:member`
   - Update: `role:member`
   - Delete: `role:admin`

**Attributes:**
```
1. displayName (String, 255 characters, required)
2. email (Email, required)
3. role (String, 50 characters, required, default: "student")
4. department (String, 100 characters, required)
5. semester (String, 20 characters, optional)
6. phoneNumber (String, 20 characters, optional)
7. profileComplete (Boolean, required, default: false)
```

**Indexes:**
- `email_index` on `email` field (unique)
- `role_index` on `role` field
- `department_index` on `department` field

### Collection 2: Documents

1. Click "Create Collection"
2. Collection ID: `documents`
3. Name: `Documents`
4. **Permissions**:
   - Create: `role:teacher`
   - Read: `role:member`
   - Update: `role:teacher`
   - Delete: `role:teacher`

**Attributes:**
```
1. title (String, 255 characters, required)
2. category (String, 50 characters, required)
3. fileUrl (URL, required)
4. targets (JSON, required) - Structure: {"departments": ["string"], "semesters": ["string"]}
5. uploadedBy (String, 255 characters, required)
6. createdAt (DateTime, required)
```

**Indexes:**
- `category_index` on `category` field
- `uploadedBy_index` on `uploadedBy` field
- `createdAt_index` on `createdAt` field

### Collection 3: Notifications (Optional - for future use)

1. Click "Create Collection"
2. Collection ID: `notifications`
3. Name: `Notifications`
4. **Permissions**:
   - Create: `role:teacher`
   - Read: `role:member`
   - Update: `role:admin`
   - Delete: `role:admin`

**Attributes:**
```
1. title (String, 255 characters, required)
2. message (String, 1000 characters, required)
3. targetUsers (JSON, required) - Array of user IDs
4. isRead (Boolean, required, default: false)
5. createdAt (DateTime, required)
```

## Step 6: Create Storage Bucket

1. Go to "Storage" in the left sidebar
2. Click "Create Bucket"
3. Bucket ID: `documents`
4. Name: `Documents Bucket`
5. **Permissions**:
   - Create: `role:teacher`
   - Read: `role:member`
   - Update: `role:teacher`
   - Delete: `role:teacher`
6. **File Security**: Enabled
7. **Maximum File Size**: 10MB (or your preferred limit)
8. **Allowed File Extensions**: `pdf`, `doc`, `docx`, `ppt`, `pptx`, `jpg`, `jpeg`, `png`

## Step 7: Set Up Authentication

1. Go to "Auth" in the left sidebar
2. Go to "Settings" tab
3. Configure the following:
   - **Session Length**: 30 days
   - **Password History**: 5 (optional)
   - **Password Dictionary**: Enabled
   - **Personal Data**: Enabled

## Step 8: Configure User Roles (Important!)

1. Go to "Auth" → "Teams"
2. Create the following teams:

### Team 1: Teachers
- **Team ID**: `teachers`
- **Name**: `Teachers`
- **Roles**: `teacher`

### Team 2: Students  
- **Team ID**: `students`
- **Name**: `Students`
- **Roles**: `student`

### Team 3: Admins
- **Team ID**: `admins` 
- **Name**: `Admins`
- **Roles**: `admin`

## Step 9: Test Your Setup

1. Start your React Native app
2. Try to register a new user
3. Complete the profile setup
4. If you're a teacher, try uploading a document
5. If you're a student, try viewing documents

## Common Issues & Solutions

### Database Not Found Error
```
ERROR: [AppwriteException: Database not found]
```
**Solution**: Make sure the database ID in `appwriteConfig.ts` matches exactly with your Appwrite console database ID.

### Collection Not Found Error
```
ERROR: [AppwriteException: Collection not found]
```
**Solution**: Verify all collection IDs match between your code and Appwrite console.

### Permission Denied Error
```
ERROR: [AppwriteException: Missing scope]
```
**Solution**: Check your collection permissions and make sure users have the correct roles assigned.

### File Upload Error
```
ERROR: [AppwriteException: File not found]
```
**Solution**: Verify your storage bucket permissions and file size limits.

## Security Best Practices

1. **Never expose API keys** in client-side code
2. **Use role-based permissions** properly
3. **Validate file uploads** on both client and server side
4. **Set appropriate file size limits**
5. **Regular backup** your database
6. **Monitor usage** and set up alerts

## Environment Variables Checklist

Make sure these are set in your `.env` file:
- [ ] `APPWRITE_ENDPOINT`
- [ ] `APPWRITE_PROJECT_ID`

And that `app.config.js` exposes them in the `extra` section.

## Database Schema Summary

```
college_hub_db/
├── users/
│   ├── displayName (string)
│   ├── email (email)
│   ├── role (string)
│   ├── department (string)
│   ├── semester (string, optional)
│   ├── phoneNumber (string, optional)
│   └── profileComplete (boolean)
├── documents/
│   ├── title (string)
│   ├── category (string)
│   ├── fileUrl (url)
│   ├── targets (json)
│   ├── uploadedBy (string)
│   └── createdAt (datetime)
└── notifications/ (optional)
    ├── title (string)
    ├── message (string)
    ├── targetUsers (json)
    ├── isRead (boolean)
    └── createdAt (datetime)
```

## Next Steps

Once your Appwrite backend is set up:
1. Test user registration and login
2. Test profile completion
3. Test document upload (as teacher)
4. Test document viewing (as student)
5. Monitor logs for any remaining issues

If you encounter any issues, check the Appwrite console logs and ensure all permissions are set correctly.