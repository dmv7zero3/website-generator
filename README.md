# Local SEO Website Generator

A comprehensive serverless system for generating location-based SEO websites using AI content generation, built on AWS infrastructure.

## Table of Contents

1. [Overview](#overview)
2. [Core Features](#core-features)
3. [Dashboard Architecture](#dashboard-architecture)
4. [Technical Implementation](#technical-implementation)
5. [Content Generation System](#content-generation-system)
6. [Data Architecture](#data-architecture)
7. [API Integration](#api-integration)
8. [Setup & Deployment](#setup--deployment)
9. [Development Guide](#development-guide)
10. [Security](#security)
11. [Monitoring & Analytics](#monitoring--analytics)
12. [Future Roadmap](#future-roadmap)
13. [Contributing](#contributing)
14. [License](#license)

## Overview

The Local SEO Website Generator is an enterprise-grade platform that automates the creation and management of location-based SEO websites. This system combines advanced AI content generation with strategic URL planning to create thousands of targeted landing pages for local businesses, maximizing their digital presence across multiple service areas.

## Core Features

### Primary Capabilities

#### 🤖 Dual AI Content Generation

- OpenAI GPT integration
- Anthropic Claude integration
- Smart content templating
- Quality validation systems

#### 📍 Location Intelligence

- Service area targeting
- Geographic content customization
- Local keyword optimization
- Regional business focus

#### 🎯 SEO Strategy

- Strategic URL pattern generation
- Keyword optimization
- Location-based content planning
- Conversion optimization

#### 📊 Business Management

- Comprehensive profile management
- Service catalog administration
- Location targeting
- Performance analytics

### Dashboard Features

- Real-time generation tracking
- Cost analytics and monitoring
- Business profile management
- SEO keyword management
- Service area configuration
- URL status monitoring
- Progress visualization

## Dashboard Architecture

### Component Details

#### Dashboard View (`Dashboard.tsx`)

- Generation status monitoring
- Real-time progress tracking
- Cost analysis display
- URL generation metrics
- Service area coverage visualization

#### Business Profile (`BusinessProfile.tsx`)

- Company information management
- Contact details administration
- Business description editor
- Target audience definition

#### Business Services (`BusinessServices.tsx`)

- Service catalog management
- Pricing configuration
- Service description editor
- Category organization

#### Service Areas (`ServiceAreas.tsx`)

- Location management, updating and saving
- State/city combination management

#### Keywords Management (`KeywordsManagement.tsx`)

- SEO keyword management
- Keyword addition and removal
- Keyword filtering
- Keyword saving

#### Prompts Management

- AI prompt template management
- Content style configuration
- Tone and voice settings
- Keywords integration
- Custom prompt creation

#### Websites Management

- List of SEO websites
- SEO websites are websites that support the main website
- Display which website is active under the business for AI webpage generation

#### Billing

- Cost tracking
- Usage analytics
- Invoice management
- Shows which business, website, how many webpages generated, how many tokens in one row
- saved into the DynamoDB mb-business-profile table

## Technical Implementation

### Frontend Stack

#### Core Technologies

- React 18.2.0
- TypeScript 5.6.3
- TailwindCSS 3.4.1
- shadcn/ui components

#### State Management

- React Context API
- Custom Hooks

#### Routing

- React Router DOM 6.27.0

#### HTTP Client

- Axios 1.7.7

### Backend Services

#### AWS Infrastructure

- Lambda (Python 3.10+)
- DynamoDB
- S3
- CloudFront
- API Gateway
- Cognito Authentication

#### AI Services

- OpenAI GPT API
- Anthropic Claude API

## Content Generation System

### URL Pattern Generation

```python
def generate_url_patterns(business_profile, service_area):
    """
    Generates strategic URL patterns for SEO targeting
    """
    patterns = {
        'service_area': f"/{service_area.city}-{service_area.state}.html",
        'service_specific': f"/{business_service}/{service_area.city}-{service_area.state}.html",
        'location_specific': f"/{service_area.city}/{business_service}-{service_area.state}.html"
    }
    return patterns
```

```typescript
/*
A hierarchical URL structure organizes URLs in a way that reflects the relationship between different types of content. This approach helps search engines understand the context and importance of each page, and it also improves user navigation. By using a hierarchical structure, you can differentiate between various types of content, such as services, keywords, and locations, reducing the risk of SEO URL cannibalization.
*/

const BASE_PATTERNS = [
  "/{city}-{state}/{service}",
  "/{city}-{state}/{keyword}",
  "/{service}/{city}-{state}",
  "/{keyword}/{city}-{state}",
  "/{city}/{service}",
  "/{city}/{keyword}",
  "/{service}/{city}",
  "/{keyword}/{city}",
];
```

### Content Types

1. Local SEO Pages
   - Business Service + Location
   - Keywords + Location

## Data Architecture

### Business Profile Schema

```typescript
interface BusinessProfile {
  business_id: string;
  business_name: string;
  business_website: string;
  business_industry: string;
  business_phone: string;
  business_address1: string;
  business_address2?: string;
  business_city: string;
  business_state: string;
  business_zip: string;
  company_history_description?: string;
  target_audience_description?: string;
  service_areas?: string[];
  business_services?: string[];
  seoKeywords?: string[];
  seoWebsites?: Array<{ website: { S: string } }>;
  prompts?: Array<{
    id: string;
    title: string;
    content: string;
    isActive: boolean;
    metadata?: {
      lastUsed?: string;
      version?: number;
      createdAt: string;
      updatedAt: string;
    };
  }>;
}
```

### DynamoDB Tables

#### Business Details Table

```typescript
{
  "PK": { "S": "BUS#<business_id>" }, // Primary key for the business profile
  "SK": { "S": "STATUS#<status>" },   // Sort key indicating the status of the business profile
  "name": { "S": "<business_name>" }, // Name of the business
  "industry": { "S": "<industry>" },  // Industry the business operates in
  "website": { "S": "<website_url>" }, // Primary website URL of the business
  "description": {
    "M": {
      "audience": { "S": "<audience_description>" }, // Audience description
      "history": { "S": "<history_description>" }    // History description
    }
  },
  "location": {
    "M": {
      "addressLine1": { "S": "<address_line_1>" }, // Address line 1
      "addressLine2": { "S": "<address_line_2>" }, // Address line 2 (optional)
      "city": { "S": "<city>" },                   // City
      "state": { "S": "<state>" },                 // State
      "zipCode": { "S": "<zip_code>" }             // ZIP/Postal code
    }
  },
  "metadata": {
    "M": {
      "createdAt": { "S": "<creation_timestamp>" }, // Creation timestamp
      "updatedAt": { "S": "<update_timestamp>" },   // Last update timestamp
      "version": { "N": "<version_number>" }        // Schema version
    }
  },
  "seoKeywords": {
    "L": [
      { "S": "<keyword_1>" }, // List of SEO keywords
      { "S": "<keyword_2>" },
      // Add more keywords as needed
    ]
  },
  "serviceAreas": {
    "L": [
      {
        "M": {
          "city": { "S": "<city>" },   // Service area city
          "state": { "S": "<state>" }  // Service area state
        }
      },
      // Add more service areas as needed
    ]
  },
  "prompts": {
    "L": [
      {
        "M": {
          "title": { "S": "<prompt_title>" }, // Title of the prompt
          "prompt": { "S": "<prompt_content>" }, // Content of the prompt
          "metadata": {
            "M": {
              "createdAt": { "S": "<creation_timestamp>" }, // Creation timestamp
              "updatedAt": { "S": "<update_timestamp>" },   // Last update timestamp
              "version": { "N": "<version_number>" }        // Schema version
            }
          }
        }
      },
      // Add more prompts as needed
    ]
  },
  "websites": {
    "M": {
      "seoWebsites": {
        "M": {
          "<seo_website_url>": {
            "M": {
              "selected": { "S": "<selected_template_id>" }, // Selected template ID
              "templates": {
                "L": [
                  {
                    "M": {
                      "id": { "S": "<template_id>" }, // Template ID
                      "category": { "S": "<template_category>" }, // Template category
                      "content": { "S": "<template_content>" }, // Template content
                      "isActive": { "BOOL": true } // Template active status
                    }
                  }
                  // Add more templates as needed
                ]
              }
            }
          }
          // Add more SEO websites as needed
        }
      },
      "website": {
        "M": {
          "selected": { "S": "<selected_template_id>" }, // Selected template ID
          "templates": {
            "L": [
              {
                "M": {
                  "id": { "S": "<template_id>" }, // Template ID
                  "category": { "S": "<template_category>" }, // Template category
                  "content": { "S": "<template_content>" }, // Template content
                  "isActive": { "BOOL": true } // Template active status
                }
              }
              // Add more templates as needed
            ]
          }
        }
      }
    }
  }
}
```

#### Generated Content Table

```typescript
{
  PK: { S: "BUS#${business_id}" },
  SK: { S: "URL#${url_id}" },

  // Content
  url: { S: string },
  content: { S: string },
  metaDescription: { S: string },
  title: { S: string },

  // Classification
  pageType: {
    S:  "local-seo-keywords" | "local-seo-services" | "local-seo-products"
  },

  // Relations
  service_area?: { S: string },
  seo_keyword?: { S: string },

  // Metadata
  created_at: { S: string },
  updated_at: { S: string },
  version: { N: number }
}
```

## API Integration

### API Endpoints

```typescript
const API_ENDPOINTS = {
  // Website Generator Base
  websiteGenerator: "/website-generator",

  // Templates Management
  addPromptTemplate: "/add-prompt-template",

  // Business Profile Management
  createBusinessProfile: "/create-business-profile",
  deleteBusinessProfile: "/delete-business-profile",
  getBusinessProfileDetails: "/get-business-profile-details",
  getBusinessProfiles: "/get-business-profiles",
  updateBusinessProfileDetails: "/update-business-profile-details",

  // Content Generation
  generatePageContent: "/generate-page-content",
  generateSeoUrls: "/generate-seo-urls",

  // Prompts Management
  getPrompts: "/get-prompts",
  updatePrompts: "/update-prompts",

  // Keywords Management
  getSeoKeywords: "/get-seo-keywords",
  updateKeywords: "/update-keywords",

  // Service Areas Management
  getServiceAreas: "/get-service-areas",
  updateServiceAreas: "/update-service-areas",
} as const;
```

## Setup & Deployment

### Prerequisites

```bash
# Required Keys
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-xxx
```

## Development Guide

### Project Structure

```
local_seo_app/
├── Configuration Files
│   ├── .babelrc                 # Babel configuration
│   ├── .env                     # Environment variables
│   ├── .gitignore              # Git ignore rules
│   ├── jsconfig.json           # JavaScript configuration
│   ├── postcss.config.cjs      # PostCSS configuration
│   ├── tailwind.config.cjs     # Tailwind CSS configuration
│   ├── tsconfig.json           # TypeScript configuration
│   └── tsconfig.node.json      # Node-specific TS config
│
├── Build Configuration
│   └── webpack/
│       ├── webpack.common.ts    # Shared webpack config
│       ├── webpack.dev.ts       # Development config
│       └── webpack.prod.ts      # Production config
│
├── Public Assets
│   └── public/
│       └── index.html          # HTML entry point
│
└── Source Code (src/)
    ├── Components
    │   ├── ui/                 # Reusable UI components
    │   │   ├── Badge.tsx
    │   │   ├── Button.tsx
    │   │   ├── Card.tsx
    │   │   ├── Input.tsx
    │   │   ├── ProgressBar.tsx
    │   │   ├── ScrollArea.tsx
    │   │   ├── Select.tsx
    │   │   ├── Table.tsx
    │   │   ├── Toast.tsx
    │   │   └── UseToast.tsx
    │   │
    │   ├── dashboard/          # Dashboard-specific components
    │   │   ├── Billing.tsx
    │   │   ├── BusinessProfile.tsx
    │   │   ├── BusinessServices.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── DashboardLayout.tsx
    │   │   ├── Header.tsx
    │   │   ├── KeywordsManagement.tsx
    │   │   ├── PromptsManagement.tsx
    │   │   ├── ServiceAreas.tsx
    │   │   ├── Sidebar.tsx
    │   │   └── WebsiteManagement.tsx
    │   │
    │   ├── App.tsx             # Root component
    │   └── ErrorBoundary.tsx   # Error handling
    │
    ├── Core
    │   ├── contexts/           # React contexts
    │   │   └── BusinessContext.tsx
    │   │
    │   ├── lib/               # Core utilities
    │   │   ├── api/           # API integration
    │   │   │   ├── index.ts
    │   │   │   └── prompts.ts
    │   │   ├── api.ts
    │   │   └── utils.ts
    │   │
    │   └── types/             # TypeScript definitions
    │       ├── global.d.ts
    │       └── prompts.ts
    │
    ├── Styles
    │   └── globals.css        # Global styles
    │
    ├── Documentation
    │   └── docs/              # Project documentation
    │       ├── README.md
    │       ├── architecture diagrams
    │       └── schema definitions
    │
    └── index.tsx              # Application entry point
```

### Component Development

```typescript
// Component Template
import React from "react";
import { useBusinessContext } from "@/contexts/BusinessContext";
import { Card, Button } from "@/components/ui";

interface ComponentProps {
  // Props definition
}

export const Component: React.FC<ComponentProps> = () => {
  // Implementation
};
```

### Style Guide

```typescript
// Naming Conventions
components / // React components
  contexts / // React contexts
  lib / // Utility functions
  styles / // Global styles
  types / // TypeScript definitions
  // File Naming
  PascalCase.tsx; // React components
camelCase.ts; // Utility files
```

## Security

### Authentication

- AWS Cognito user pools
- JWT token authentication
- Role-based access control

### Data Protection

- HTTPS encryption
- Data encryption at rest
- Secure environment variables

### API Security

- API Gateway authorization
- Request validation
- Rate limiting

## Monitoring & Analytics

### Performance Monitoring

- Generation success rates
- API response times
- Error tracking
- Resource utilization

### Cost Analysis

- AI API usage
- Per session generation cost

## Future Roadmap

### Planned Features

1. S3 Static Website Deployment
   - Deploy website
2. Version control with GitHub

## License

This project is proprietary and confidential. © 2024 MarketBrewer LLC. All rights reserved.

For support or inquiries, email Jorge Giraldez at inquiry@marketbrewer.com. MarketBrewer LLC.
