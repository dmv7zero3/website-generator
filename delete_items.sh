count=0
total=$(aws dynamodb scan --table-name mb-generated-urls --select COUNT --output json | jq '.Count')

aws dynamodb scan \
    --table-name mb-generated-urls \
    --projection-expression "PK,SK" \
    --output json | \
jq -c '.Items[]' | \
while read -r item; do
    aws dynamodb delete-item \
        --table-name mb-generated-urls \
        --key "$item"
    ((count++))
    echo "Deleted $count of $total items"
    sleep 0.1
done
