// src/types/index.ts
export interface DynamoDBAttribute<T> {
  S?: string;
  N?: string;
  BOOL?: boolean;
  M?: { [key: string]: DynamoDBAttribute<any> };
  L?: DynamoDBAttribute<any>[];
}

export interface GoogleMapLocation {
  id: string;
  name: string;
  location: string;
  locationId: string;
}

export interface DynamoDBLocationMap {
  M: {
    id: { S: string };
    name: { S: string };
    location: { S: string };
    locationId: { S: string };
  };
}

export interface DynamoDBProfile {
  PK: { S: string };
  SK: { S: string };
  name: { S: string };
  website: { S: string };
  industry: { S: string };
  location: {
    M: {
      addressLine1: { S: string };
      addressLine2: { S: string };
      city: { S: string };
      state: { S: string };
      zipCode: { S: string };
    };
  };
  description: {
    M: {
      history: { S: string };
      audience: { S: string };
    };
  };
  serviceAreas: {
    L: Array<{
      M: {
        city: { S: string };
        state: { S: string };
      };
    }>;
  };
  businessServices?: Array<{ S: string }>;
  seoKeywords?: {
    L: Array<{ S: string }>;
  };
  metadata: {
    M: {
      createdAt: { S: string };
      updatedAt: { S: string };
      version: { N: string };
    };
  };
  googleMapLocations?: {
    L: Array<{
      M: {
        id: { S: string };
        name: { S: string };
        location: { S: string };
        locationId: { S: string };
      };
    }>;
  };
  seoWebsites: {
    M: {
      [key: string]: {
        M: {
          id: { S: string };
          isActive: { BOOL: boolean };
          name: { S: string };
        };
      };
    };
  };
}

export type UploadStatus = {
  id: string;
  fileName: string;
  store: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
  uploadedAt?: string;
  fileKey?: string;
};
