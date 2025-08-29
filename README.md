# THESEUS: An LLM-powered Software Bridging the OHDSI Ecosystem OMOP-CDM Observational Studies
<img width="480" height="480" alt="Theseus" src="https://github.com/user-attachments/assets/362e9ace-f352-4620-9ddb-64876ec37ecb" />
For reproducible observational studies using the Observational Medical Outcomes Partnership Common Data Model (OMOP-CDM), the Observational Health Data Sciences and Informatics (OHDSI) community provides an open-source ecosystem. However, network studies often require R-based execution, creating barriers for researchers without coding expertise. To address this, we developed THESEUS, an LLM-powered GUI software bridging the OHDSI ecosystem for observational studies. THESEUS integrates two LLM modules: (1) **Text-to-JSON**: Convert free-text to UI settings and (2) **JSON-to-Strategus**: Convert UI settings to R scripts.

## Table of Contents

- [Features](#features)  
- [Demo](#demo)  
- [Tech Stack](#tech-stack)  
- [Prerequisites](#prerequisites)  
- [Installation](#installation)  
- [Running the Application](#running-the-application)  
- [Project Structure](#project-structure)  
- [API Documentation](#api-documentation)  
- [Development Guidelines](#development-guidelines)  

## Features

1. **GUI Tool**  
We developed a prototype GUI that resembles the "population-level estimation" tab of ATLAS. It allows users to configure study designs through manual clicks.

2. **Converting Free-text to UI Settings**  
An LLM-based module, called *Text-to-JSON*, converts free-text descriptions of study designs into a predefined JSON format. Based on the generated JSON, the system allows users to compare the proposed settings with the existing GUI configurations and selectively adopt changes.

3. **Converting UI Settings to R Scripts**  
Another LLM-based module, called *JSON-to-Strategus*, transforms the JSON representation of GUI configurations into Strategus R scripts. The generated scripts can be readily copied into a Strategus study template and executed without modification. The module also embeds annotations within the scripts, providing explanations for users.

## Demo
<img width="791" height="411" alt="image" src="https://github.com/user-attachments/assets/e6ac4662-f65e-4164-9321-45a8dfef1f92" />

- You can test THESEUS by entering your **OpenAI API key**.  
- We are using **ChatGPT 4.1** as the LLM engine.  
- Prototype: [https://theseus2.vercel.app/](https://theseus2.vercel.app/)  
- Demo video: [https://youtu.be/tfvWasqaWbY](https://youtu.be/tfvWasqaWbY)  

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript  
- **Styling**: Tailwind CSS  
- **Backend**: Next.js 15 monorepo  
- **Database**: No database connection (no data persistence)  

## Prerequisites

- Node.js 18.x or higher  
- pnpm package manager  
- OpenAI API key (required for LLM features)  

## Installation

1. Clone the repository:

```bash
git clone https://github.com/theseus-app/theseus.git
cd theseus
```

2. Install dependencies:

```bash
pnpm install
```

## Running the Application

### Development Mode

```bash
# Start the development server
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Production Build

```bash
# Build for production
pnpm build

# Start the production server
pnpm start
```

## Project Structure

```
cv/
 ├── src/
 │   ├── app/                  # Next.js App Router pages and API routes
 │   │   ├── api/              # API endpoints
 │   ├── components/           # React components, root contains common components
 │   │   ├── modal/            # modal components
 │   │   ├── primitive/        # small reusable components within sections
 │   │   └── section/          # resume editing/preview sections and shared components
 │   │        ├── analysisSetting/           # analysis setting section
 │   │        ├── comparisonSectionCard/     # comparison section cards
 │   ├── server/               # API service layer
 │   ├── types/                # TypeScript definitions
 │   ├── hooks/                # custom React hooks
 │   ├── stores/               # MobX (global state) management
 │   ├── assets/               # icons and static assets
 │   └── utils/                # utility functions
 ├── public/                   # static assets
```

## API Documentation

### AI Features

- `POST /api/atlas/json2strategus` — Convert given UI settings into Strategus R scripts (LLM-powered).  
- `POST /api/atlas/text2json` — Convert free-text descriptions into UI settings.  

## Development Guidelines

### Code Style

1. **Components**: Use `function ComponentName () {}` syntax.  
2. **Exports**: Wrap global state components with `Observer()` when required.  
3. **File Naming**: Use `camelCase` for files and directories.  
4. **Server Components**: Default to server components, use `'use client'` only when necessary.  

### Git Workflow

1. Create feature branches from `master`.  
2. Follow conventional commits (`feat:`, `fix:`, `docs:`, etc.).  
3. Run a build before committing to ensure no build errors.  
4. Open a pull request for review.  
