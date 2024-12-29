#!/bin/bash

# Define the time period for CloudWatch metrics
START_TIME="2024-12-01T00:00:00Z"
END_TIME="2024-12-31T23:59:59Z"
PERIOD=3600  # 1 hour intervals

# List all DynamoDB tables
TABLES=$(aws dynamodb list-tables --query "TableNames[]" --output text)

# Iterate over each table
for TABLE in $TABLES; do
    echo "Table: $TABLE"

    # Get table details
    TABLE_DETAILS=$(aws dynamodb describe-table --table-name "$TABLE")

    # Extract provisioned capacity units
    BILLING_MODE=$(echo "$TABLE_DETAILS" | jq -r '.Table.BillingModeSummary.BillingMode')
    if [ "$BILLING_MODE" == "PROVISIONED" ]; then
        PROVISIONED_READ=$(echo "$TABLE_DETAILS" | jq -r '.Table.ProvisionedThroughput.ReadCapacityUnits')
        PROVISIONED_WRITE=$(echo "$TABLE_DETAILS" | jq -r '.Table.ProvisionedThroughput.WriteCapacityUnits')
        echo "Provisioned Read Capacity Units: $PROVISIONED_READ"
        echo "Provisioned Write Capacity Units: $PROVISIONED_WRITE"
    else
        echo "Billing Mode: $BILLING_MODE"
    fi

    # Get consumed read capacity units from CloudWatch
    CONSUMED_READ=$(aws cloudwatch get-metric-statistics \
        --namespace AWS/DynamoDB \
        --metric-name ConsumedReadCapacityUnits \
        --dimensions Name=TableName,Value="$TABLE" \
        --start-time "$START_TIME" \
        --end-time "$END_TIME" \
        --period "$PERIOD" \
        --statistics Sum \
        --query "Datapoints[].Sum" \
        --output text | awk '{sum += $1} END {print sum}')

    # Get consumed write capacity units from CloudWatch
    CONSUMED_WRITE=$(aws cloudwatch get-metric-statistics \
        --namespace AWS/DynamoDB \
        --metric-name ConsumedWriteCapacityUnits \
        --dimensions Name=TableName,Value="$TABLE" \
        --start-time "$START_TIME" \
        --end-time "$END_TIME" \
        --period "$PERIOD" \
        --statistics Sum \
        --query "Datapoints[].Sum" \
        --output text | awk '{sum += $1} END {print sum}')

    echo "Total Consumed Read Capacity Units: ${CONSUMED_READ:-0}"
    echo "Total Consumed Write Capacity Units: ${CONSUMED_WRITE:-0}"
    echo "---------------------------------------------"
done
