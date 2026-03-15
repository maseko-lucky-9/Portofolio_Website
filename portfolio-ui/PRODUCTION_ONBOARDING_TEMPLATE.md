# Production Onboarding Seeding Template

**Status:** Draft
**Version:** 1.0
**Target System:** Portfolio UI Data Layer (`src/data`)

---

## Overview

This document serves as the authoritative template for populating user profiles in the production environment. All data entered here must strictly adhere to the formats and validation rules specified to ensure the application functions correctly.

## 1. Personal Data

**Source:** `src/data/personal.ts` -> `personalData` object

| Field Name     | Display Label       | Description                                              | Data Type | Required | Example Value                                | Notes / Validation                       |
| :------------- | :------------------ | :------------------------------------------------------- | :-------- | :------- | :------------------------------------------- | :--------------------------------------- |
| `name`         | Full Name           | The user's full display name.                            | String    | **Yes**  | "Jane Doe"                                   | Max 50 chars recommended.                |
| `title`        | Job Title           | Professional role or tagline title.                      | String    | **Yes**  | "Senior Full-Stack Developer"                | Appears in Hero section.                 |
| `tagline`      | Bio / Value Prop    | A detailed professional biography and value proposition. | String    | **Yes**  | "I'm a software engineer specializing in..." | Markdown supported. Rec. 200-300 chars.  |
| `email`        | Email Address       | Public contact email.                                    | String    | **Yes**  | "jane@example.com"                           | Standard email format.                   |
| `location`     | Location            | physical City/Country.                                   | String    | **Yes**  | "San Francisco, CA"                          |                                          |
| `availability` | Availability Status | Current work availability status.                        | String    | **Yes**  | "Open to opportunities"                      |                                          |
| `resumeUrl`    | Resume Link         | Path or URL to download resume.                          | String    | Optional | "/resume.pdf"                                | Local path in `public/` or external URL. |
| `profileImage` | Profile Image       | URL to the user's avatar/profile photo.                  | String    | Optional | "https://example.com/me.jpg"                 | Rec. 400x400px square.                   |

### 1.1 Key Metrics

**Source:** `src/data/personal.ts` -> `personalData.metrics` object

| Field Name   | Display Label    | Description                            | Data Type | Required | Example Value | Notes                   |
| :----------- | :--------------- | :------------------------------------- | :-------- | :------- | :------------ | :---------------------- |
| `projects`   | Project Count    | Number of completed projects.          | String    | **Yes**  | "20+"         | Can include "+" suffix. |
| `experience` | Years Experience | Years of professional experience.      | String    | **Yes**  | "7 Years"     |                         |
| `clients`    | Client Count     | Number of satisfied clients/employers. | String    | **Yes**  | "10+"         |                         |

### 1.2 Social Links

**Source:** `src/data/personal.ts` -> `personalData.social` object

| Field Name | Display Label | Description                    | Data Type | Required | Example Value                  | Notes                            |
| :--------- | :------------ | :----------------------------- | :-------- | :------- | :----------------------------- | :------------------------------- |
| `github`   | GitHub URL    | Link to GitHub profile.        | String    | Optional | "https://github.com/username"  |                                  |
| `linkedin` | LinkedIn URL  | Link to LinkedIn profile.      | String    | Optional | "https://linkedin.com/in/user" |                                  |
| `twitter`  | X/Twitter URL | Link to Twitter/X profile.     | String    | Optional | "https://twitter.com/username" |                                  |
| `calendar` | Calendar URL  | Link to booking/calendar page. | String    | Optional | "https://cal.com/username"     | Used for "Book a call" features. |

### 1.3 SEO Configuration

**Source:** `src/data/personal.ts` -> `seoData` object

| Field Name    | Display Label    | Description                      | Data Type | Required | Example Value              | Notes                      |
| :------------ | :--------------- | :------------------------------- | :-------- | :------- | :------------------------- | :------------------------- | --- |
| `title`       | Meta Title       | Browser tab title and SEO title. | String    | **Yes**  | "Jane Doe                  | Software Engineer"         |     |
| `description` | Meta Description | Summary for search engines.      | String    | **Yes**  | "Portfolio of Jane Doe..." | Max 160 chars recommended. |
| `keywords`    | Meta Keywords    | Comma-separated keywords.        | String    | **Yes**  | "developer, react, node"   |                            |

---

## 2. Skills

**Source:** `src/data/skills.ts` -> `skills` array

_Multiple entries allowed. No strict limit, but 10-20 recommended._

| Field Name    | Display Label | Description                        | Data Type | Required | Example Value | Notes / Validation                               |
| :------------ | :------------ | :--------------------------------- | :-------- | :------- | :------------ | :----------------------------------------------- |
| `name`        | Skill Name    | Name of the technology or skill.   | String    | **Yes**  | "React"       |                                                  |
| `proficiency` | Proficiency % | Self-assessed skill level (0-100). | Number    | **Yes**  | 95            | Used for progress bars.                          |
| `category`    | Category      | High-level grouping.               | Enum      | **Yes**  | "frontend"    | Values: `frontend`, `backend`, `devops`          |
| `type`        | Type          | Granular type classification.      | Enum      | **Yes**  | "framework"   | Values: `language`, `framework`, `tool`, `cloud` |

### 2.1 Skills Visualization (Radar Chart)

**Source:** `src/data/skills.ts` -> `radarSkills` object

_Confirms specific high-level skills for the radar chart widget. Organized by category._
_Categories: `frontend`, `backend`, `devops`._

| Field Name | Display Label | Description                     | Data Type | Required | Example Value   | Notes                   |
| :--------- | :------------ | :------------------------------ | :-------- | :------- | :-------------- | :---------------------- |
| `skill`    | Axis Label    | Label for the radar chart axis. | String    | **Yes**  | "System Design" | Keep short (1-2 words). |
| `value`    | Score (0-100) | Value on the axis.              | Number    | **Yes**  | 85              |                         |

---

## 3. Projects

**Source:** `src/data/projects.ts` -> `projects` array

_Multiple entries allowed. Order determines display order._

| Field Name     | Display Label   | Description                     | Data Type     | Required | Example Value                 | Notes / Validation    |
| :------------- | :-------------- | :------------------------------ | :------------ | :------- | :---------------------------- | :-------------------- |
| `id`           | Slug / ID       | URL-friendly unique identifier. | String        | **Yes**  | "ecommerce-platform"          | No spaces, lowercase. |
| `title`        | Project Title   | Name of the project.            | String        | **Yes**  | "E-Commerce Platform"         |                       |
| `tagline`      | Tagline         | Short, punchy subtitle.         | String        | **Yes**  | "Scalable. Fast. Secure."     |                       |
| `description`  | Description     | Brief overview of the project.  | String        | **Yes**  | "A full-featured..."          |                       |
| `thumbnail`    | Thumbnail URL   | Card image URL.                 | String        | **Yes**  | "https://..."                 |                       |
| `technologies` | Tech Stack      | List of technologies used.      | Array<String> | **Yes**  | `["React", "Node.js"]`        |                       |
| `challenge`    | The Challenge   | Problem statement.              | String        | **Yes**  | "The client needed..."        |                       |
| `solution`     | The Solution    | How it was solved.              | String        | **Yes**  | "Implemented event-driven..." |                       |
| `impact`       | The Impact      | Quantifiable results.           | String        | **Yes**  | "Achieved 99.9% uptime..."    |                       |
| `liveUrl`      | Live Link       | URL to the live demo/site.      | String        | Optional | "https://example.com"         |                       |
| `githubUrl`    | GitHub Link     | URL to valid repository.        | String        | Optional | "https://github.com/..."      |                       |
| `caseStudyUrl` | Case Study Link | Internal path to case study.    | String        | Optional | "/projects/startups"          |                       |
| `featured`     | Is Featured?    | Show on homepage/highlights.    | Boolean       | **Yes**  | `true`                        |                       |

---

## 4. Experience

**Source:** `src/data/experience.ts` -> `experiences` array

_Multiple entries allowed. Typically ordered reverse-chronological._

| Field Name     | Display Label    | Description                       | Data Type     | Required | Example Value                         | Notes / Validation        |
| :------------- | :--------------- | :-------------------------------- | :------------ | :------- | :------------------------------------ | :------------------------ |
| `id`           | ID               | Unique identifier.                | String        | **Yes**  | "senior-dev-techcorp"                 |                           |
| `company`      | Company Name     | Name of employer/client.          | String        | **Yes**  | "TechCorp Inc."                       |                           |
| `role`         | Job Role         | Position title.                   | String        | **Yes**  | "Senior Software Engineer"            |                           |
| `location`     | Location         | Work location or "Remote".        | String        | **Yes**  | "San Francisco, CA"                   |                           |
| `startDate`    | Start Date       | Start of employment.              | String        | **Yes**  | "Jan 2022"                            | Text format (Month Year). |
| `endDate`      | End Date         | End of employment or "Present".   | String        | **Yes**  | "Present"                             |                           |
| `description`  | Summary          | High-level role description.      | String        | **Yes**  | "Leading development..."              |                           |
| `achievements` | Key Achievements | List of specific accomplishments. | Array<String> | **Yes**  | `["Led migration...", "Improved..."]` | 3-5 items recommended.    |
| `technologies` | Tech Stack       | Technologies used in this role.   | Array<String> | **Yes**  | `["React", "AWS"]`                    |                           |
| `logoUrl`      | Company Logo     | URL to company logo image.        | String        | Optional | "https://..."                         | Square aspect ratio.      |

---

## 5. Latest Articles (Blog)

**Source:** `src/data/blog.ts` -> `blogPosts` array

_Multiple entries allowed. Sourced here if not using an external CMS/Feed._

| Field Name    | Display Label | Description                 | Data Type     | Required | Example Value              | Notes / Validation           |
| :------------ | :------------ | :-------------------------- | :------------ | :------- | :------------------------- | :--------------------------- |
| `id`          | Slug / ID     | Unique identifier.          | String        | **Yes**  | "react-performance"        |                              |
| `title`       | Article Title | Headline of the article.    | String        | **Yes**  | "Optimizing React..."      |                              |
| `excerpt`     | Excerpt       | Short summary/preview text. | String        | **Yes**  | "Deep dive into..."        |                              |
| `publishedAt` | Publish Date  | Date of publication.        | String        | **Yes**  | "Dec 15, 2024"             | Formatted date string.       |
| `readTime`    | Read Time     | Estimated time to read.     | String        | **Yes**  | "8 min read"               |                              |
| `tags`        | Tags          | Topic categories.           | Array<String> | **Yes**  | `["React", "Performance"]` |                              |
| `imageUrl`    | Cover Image   | URL to article cover image. | String        | **Yes**  | "https://..."              | Landscape aspect ratio.      |
| `url`         | Link URL      | Full link to the article.   | String        | **Yes**  | "https://medium.com/..."   | Can be external or internal. |
