# Warren Fork Example Terraform

This directory includes the terraform configuration we used to configure all the resources we needed. It's likely not useful as-is, but rather serves as a guide for the infrastructure you'll need to stand up to run Spoke on AWS.

This terraform module sets up:

- SSM parameters for various secrets used by Spoke
- An S3 bucket for private user content like CSV uploads
- An Aurora Serverless Postgres database
- An SQS queue and API gateway endpoint that feeds into that queue for receiving messages from Twilio. We didn't end up using this directly -- we still configured Twilio to send messages directly to Spoke -- but we used the API Gateway endpoint as the Twilio fallback URL so if Spoke did experience and outage or transient failure while processing a Twilio webhook, Twilio would fall back to delivering the message to the SQS queue where we could manually replay it.


Not included in this terraform module:

- We had a separate public CDN setup with S3 and CloudFront that was used to serve static assets. For example, the `scripts/deploy-tools` script copies the built client-side javascript to this bucket, which was called `ew-spoke-public`. This was then served by CloudFront on the domain https://ew-spoke-public.elizabethwarren.codes/ which was configured in `serverless.yml` as our `ASSET_DOMAIN`.