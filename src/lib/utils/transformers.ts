import {
  DynamoDBProfile,
  GoogleMapLocation,
  DynamoDBLocationMap,
} from "@/types/index";
import { BusinessProfile } from "@/lib/api";

export const transformers = {
  fromDynamoDB(dbProfile: DynamoDBProfile): BusinessProfile {
    console.log("Transforming DynamoDB profile:", dbProfile);

    const pk = dbProfile.PK?.S ?? "";
    const name = dbProfile.name?.S ?? "";
    const website = dbProfile.website?.S ?? "";
    const industry = dbProfile.industry?.S ?? "";

    const getLocationValue = (field: keyof DynamoDBProfile["location"]["M"]) =>
      dbProfile.location?.M?.[field]?.S ?? "";

    const getDescriptionValue = (
      field: keyof DynamoDBProfile["description"]["M"]
    ) => dbProfile.description?.M?.[field]?.S ?? "";

    const transformServiceAreas = () =>
      dbProfile.serviceAreas?.L?.map((area) => ({
        city: area.M.city?.S ?? "",
        state: area.M.state?.S ?? "",
      })) || [];

    const transformSeoWebsites = () =>
      Object.entries(dbProfile.seoWebsites?.M || {}).map(([url, site]) => ({
        url,
        id: site.M.id?.S ?? "",
        isActive: site.M.isActive?.BOOL ?? false,
        name: site.M.name?.S ?? "",
      }));

    const transformGoogleMapLocations = () => {
      console.log(
        "Transforming Google Map Locations:",
        dbProfile.googleMapLocations
      );

      if (!Array.isArray(dbProfile.googleMapLocations)) {
        console.log(
          "googleMapLocations is not an array:",
          dbProfile.googleMapLocations
        );
        return [];
      }

      const locations = dbProfile.googleMapLocations.map((location) => {
        console.log("Processing location:", location);
        const id = location.id ?? "";
        const name = location.name ?? "";
        const loc = location.location ?? "";
        const locationId = location.locationId ?? "";
        console.log(
          "id:",
          id,
          "name:",
          name,
          "location:",
          loc,
          "locationId:",
          locationId
        );
        return {
          id,
          name,
          location: loc,
          locationId,
        };
      });

      console.log("Transformed Google Map Locations:", locations);
      return locations;
    };

    return {
      business_id: pk.replace("BUS#", ""),
      business_name: name,
      business_website: website,
      business_industry: industry,
      business_address1: getLocationValue("addressLine1"),
      business_address2: getLocationValue("addressLine2"),
      business_city: getLocationValue("city"),
      business_state: getLocationValue("state"),
      business_zip: getLocationValue("zipCode"),
      company_history_description: getDescriptionValue("history"),
      target_audience_description: getDescriptionValue("audience"),
      service_areas: transformServiceAreas(),
      business_services:
        dbProfile.businessServices?.map((svc) => svc.S ?? "") || [],
      seoKeywords:
        dbProfile.seoKeywords?.L?.map((keyword) => keyword.S ?? "") || [],
      seoWebsites: transformSeoWebsites(),
      googleMapLocations: transformGoogleMapLocations(),
    };
  },

  toDynamoDB(profile: BusinessProfile): DynamoDBProfile {
    const transformSeoWebsites = () =>
      profile.seoWebsites?.reduce(
        (
          acc: Record<
            string,
            {
              M: {
                id: { S: string };
                isActive: { BOOL: boolean };
                name: { S: string };
              };
            }
          >,
          site
        ) => {
          acc[site.url] = {
            M: {
              id: { S: site.id },
              isActive: { BOOL: site.isActive },
              name: { S: site.name },
            },
          };
          return acc;
        },
        {}
      ) || {};

    return {
      PK: { S: `BUS#${profile.business_id}` },
      SK: { S: "STATUS#active" },
      name: { S: profile.business_name },
      website: { S: profile.business_website },
      industry: { S: profile.business_industry },
      location: {
        M: {
          addressLine1: { S: profile.business_address1 },
          addressLine2: { S: profile.business_address2 || "" },
          city: { S: profile.business_city },
          state: { S: profile.business_state },
          zipCode: { S: profile.business_zip },
        },
      },
      description: {
        M: {
          history: { S: profile.company_history_description || "" },
          audience: { S: profile.target_audience_description || "" },
        },
      },
      serviceAreas: {
        L:
          profile.service_areas?.map((area) => ({
            M: {
              city: { S: area.city },
              state: { S: area.state },
            },
          })) || [],
      },
      businessServices:
        profile.business_services?.map((svc) => ({ S: svc })) || [],
      seoKeywords: {
        L: profile.seoKeywords?.map((keyword) => ({ S: keyword })) || [],
      },
      metadata: {
        M: {
          createdAt: { S: new Date().toISOString() },
          updatedAt: { S: new Date().toISOString() },
          version: { N: "1" },
        },
      },
      seoWebsites: {
        M: transformSeoWebsites(),
      },
      googleMapLocations: {
        L:
          profile.googleMapLocations?.map((location) => ({
            M: {
              id: { S: location.id },
              name: { S: location.name },
              location: { S: location.location },
              locationId: { S: location.locationId },
            },
          })) || [],
      },
    };
  },
};
