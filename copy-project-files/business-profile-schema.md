// src/docs/business-profile-schema.md
graph TD
BP[BusinessProfile] --> BI[Basic Information]
BP --> BD[Business Description]
BP --> SA[Service Areas]
BP --> BS[Business Services]
BP --> BH[Business Hours]
BP --> SC[Social Connections]

    BI --> |business_id| ID[Business ID]
    BI --> |business_website| WS[Website]
    BI --> |business_city| CT[City]
    BI --> |business_state| ST[State]
    BI --> |business_phone| PH[Phone]
    BI --> |business_email| EM[Email]

    BD --> |company_history| CH[Company History]
    BD --> |target_audience| TA[Target Audience]

    SA --> |servicearea_city| SAC[City List]
    SA --> |servicearea_state| SAS[State List]

    BS --> |businessservice_name| BSN[Service Names]
    BS --> |businessservice_description| BSD[Service Descriptions]
    BS --> |businessservice_price| BSP[Service Prices]

    BH --> MON[Monday Hours]
    BH --> TUE[Tuesday Hours]
    BH --> WED[Wednesday Hours]
    BH --> THU[Thursday Hours]
    BH --> FRI[Friday Hours]
    BH --> SAT[Saturday Hours]
    BH --> SUN[Sunday Hours]

    SC --> |business_facebook| FB[Facebook]
    SC --> |business_instagram| IG[Instagram]
    SC --> |business_twitter| TW[Twitter]
    SC --> |business_linkedin| LI[LinkedIn]
    SC --> |business_yelp| YP[Yelp]
