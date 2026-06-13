# Testing the Portfolio API

This guide shows you how to test all the features of your new portfolio API.

## 🚀 Quick Start

1. **Open Swagger UI**: http://localhost:3000/api-docs
2. **Use the interactive interface** to test endpoints
3. **Or use the curl commands** below

## 🔐 Authentication Flow

### 1. Register a New User (Optional)
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 2. Login (Get Access Token)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@portfolio.dev",
    "password": "admin123"
  }'
```

**Save the `accessToken` from the response!**

Example response:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "abc123...",
    "user": {
      "id": "...",
      "email": "admin@portfolio.dev",
      "role": "ADMIN"
    }
  }
}
```

### 3. Get Your Profile
```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📂 Projects (Public)

### List All Projects
```bash
curl -X GET "http://localhost:3000/api/v1/projects?page=1&limit=10"
```

### List Featured Projects Only
```bash
curl -X GET "http://localhost:3000/api/v1/projects?featured=true"
```

### Search Projects
```bash
curl -X GET "http://localhost:3000/api/v1/projects?search=ecommerce"
```

### Filter by Tag
```bash
curl -X GET "http://localhost:3000/api/v1/projects?tag=react"
```

### Get Single Project
```bash
curl -X GET http://localhost:3000/api/v1/projects/ecommerce-platform
```

## 📝 Articles (Public)

### List All Articles
```bash
curl -X GET "http://localhost:3000/api/v1/articles?page=1&limit=10"
```

### Get Single Article
```bash
curl -X GET http://localhost:3000/api/v1/articles/building-scalable-apis
```

## 📂 Projects (Admin)

### Create New Project (Requires Auth)
```bash
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "my-awesome-project",
    "title": "My Awesome Project",
    "description": "A brief description",
    "content": "# My Project\n\nThis is the full content in Markdown.",
    "techStack": ["React", "Node.js", "PostgreSQL"],
    "featured": true,
    "status": "PUBLISHED",
    "tagIds": []
  }'
```

### Update Project (Requires Auth)
```bash
curl -X PUT http://localhost:3000/api/v1/projects/PROJECT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "featured": false
  }'
```

### Delete Project (Requires Auth)
```bash
curl -X DELETE http://localhost:3000/api/v1/projects/PROJECT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📝 Articles (Admin)

### Create New Article (Requires Auth)
```bash
curl -X POST http://localhost:3000/api/v1/articles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "my-first-article",
    "title": "My First Article",
    "content": "# Introduction\n\nThis is my first article...",
    "featured": false,
    "status": "PUBLISHED",
    "tagIds": []
  }'
```

### Update Article (Requires Auth)
```bash
curl -X PUT http://localhost:3000/api/v1/articles/ARTICLE_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Article Title"
  }'
```

### Delete Article (Requires Auth)
```bash
curl -X DELETE http://localhost:3000/api/v1/articles/ARTICLE_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📧 Contact Form

### Submit Contact Form
```bash
curl -X POST http://localhost:3000/api/v1/contact/submit \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Interested in your services",
    "message": "Hello, I would like to discuss a project..."
  }'
```

### List Submissions (Admin)
```bash
curl -X GET http://localhost:3000/api/v1/contact/submissions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Submission Status (Admin)
```bash
curl -X PATCH http://localhost:3000/api/v1/contact/submissions/SUBMISSION_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "READ",
    "notes": "Follow up next week"
  }'
```

## 📬 Newsletter

### Subscribe
```bash
curl -X POST http://localhost:3000/api/v1/contact/newsletter \
  -H "Content-Type: application/json" \
  -d '{
    "email": "subscriber@example.com",
    "firstName": "Jane"
  }'
```

### Confirm Subscription
```bash
curl -X GET http://localhost:3000/api/v1/contact/newsletter/confirm/CONFIRMATION_TOKEN
```

### Unsubscribe
```bash
curl -X GET http://localhost:3000/api/v1/contact/newsletter/unsubscribe/UNSUBSCRIBE_TOKEN
```

### List Subscribers (Admin)
```bash
curl -X GET http://localhost:3000/api/v1/contact/newsletter/subscribers \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Newsletter Stats (Admin)
```bash
curl -X GET http://localhost:3000/api/v1/contact/newsletter/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🏥 Health Checks

### Basic Health
```bash
curl -X GET http://localhost:3000/api/v1/health
```

### Detailed Health
```bash
curl -X GET http://localhost:3000/api/v1/health/detailed
```

### Kubernetes Readiness
```bash
curl -X GET http://localhost:3000/api/v1/health/ready
```

### Kubernetes Liveness
```bash
curl -X GET http://localhost:3000/api/v1/health/live
```

## 🎨 Using Swagger UI (Recommended)

The easiest way to test is using Swagger UI:

1. **Open**: http://localhost:3000/api-docs
2. **Click** on any endpoint to expand it
3. **Click "Try it out"**
4. **Fill in** the parameters
5. **Click "Execute"**
6. **See** the response

### Authenticating in Swagger UI

1. Click the **"Authorize"** button at the top
2. Enter: `Bearer YOUR_ACCESS_TOKEN`
3. Click **"Authorize"**
4. Now all admin endpoints will work!

## 📊 Test Scenarios

### Scenario 1: Content Manager Workflow
1. Login as admin
2. Create a new project
3. Upload some images (use URLs)
4. Create an article about the project
5. View the project on the public endpoint
6. Check analytics for views

### Scenario 2: Visitor Interaction
1. Browse projects (no auth needed)
2. Read an article (no auth needed)
3. Submit a contact form
4. Subscribe to newsletter
5. Confirm subscription via email link

### Scenario 3: Admin Dashboard
1. Login as admin
2. Check contact submissions
3. Update submission status
4. View newsletter subscribers
5. Check subscriber statistics

## 🔍 Exploring Features

### Caching
- Make the same GET request twice
- Second request will be faster (served from Redis)
- Check server logs to see cache hits/misses

### Rate Limiting
- Make 100+ requests in 1 minute to the same endpoint
- You should get a `429 Too Many Requests` error
- Wait 1 minute and try again

### Error Handling
- Try creating a project without authentication → `401 Unauthorized`
- Try creating a project with invalid data → `400 Bad Request`
- Try accessing a non-existent project → `404 Not Found`

### Validation
- Submit a contact form with an invalid email → validation error
- Create a project with a duplicate slug → conflict error
- Try to login with wrong password → authentication error

## 🎯 Key Features to Demo

1. **Authentication**
   - Register/Login flow
   - JWT token refresh
   - Role-based access

2. **Content Management**
   - Create/Update/Delete projects
   - Markdown content with syntax highlighting
   - Tag management

3. **Caching**
   - Fast response times
   - Automatic cache invalidation

4. **Security**
   - Rate limiting
   - Input validation
   - Password hashing

5. **Documentation**
   - Self-documenting API
   - Interactive testing

## 🐛 Troubleshooting

### "Unauthorized" error
- Make sure you're logged in and have a valid access token
- Check that you're including the `Authorization: Bearer TOKEN` header

### "Not Found" error
- Verify the slug/ID is correct
- Check that the resource exists (not deleted)

### "Too Many Requests" error
- Wait 1 minute for rate limit to reset
- Or restart Redis: `docker-compose restart redis`

### Server not responding
- Check if server is running: `npm run dev`
- Check if Docker containers are up: `docker-compose ps`
- Check logs: `docker-compose logs -f`

---

Happy Testing! 🎉

For more details, see the full API documentation at http://localhost:3000/api-docs
