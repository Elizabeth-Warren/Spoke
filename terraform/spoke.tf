# Spoke Infrastructure
resource "random_password" "spoke_session_secret" {
  length  = 40
  special = true
}

resource "random_password" "spoke_db_user_password" {
  length           = 40
  special          = true
  override_special = "_+=()"
}

resource "aws_ssm_parameter" "spoke_session_secret_param" {
  name  = "/${local.env}/spoke/SESSION_SECRET"
  type  = "SecureString"
  value = random_password.spoke_session_secret.result
}

resource "aws_ssm_parameter" "spoke_db_user" {
  name  = "/${local.env}/spoke/postgres/USER"
  type  = "String"
  value = "spoke"
}

resource "aws_ssm_parameter" "spoke_db_user_password" {
  name  = "/${local.env}/spoke/postgres/PASSWORD"
  type  = "SecureString"
  value = random_password.spoke_db_user_password.result
}

resource "aws_ssm_parameter" "spoke_db_name" {
  name  = "/${local.env}/spoke/postgres/DATABASE"
  type  = "String"
  value = "spoke"
}

module "spoke_private_bucket" {
  source      = "./modules/s3-locked"
  name        = "spoke-private"
  env         = local.env
  tags        = local.default_tags
  enable_cors = true
}

module "spoke_db" {
  source                      = "./modules/aurora_postgres_serverless"
  name                        = "spoke"
  env                         = local.env
  autopause                   = local.settings.spoke_db_autopause
  azs                         = local.settings.azs
  subnet_ids                  = module.vpc.private_subnets
  vpc_security_group_ids      = [aws_security_group.aurora_pg_sg.id]
  alarm_connections_threshold = local.settings.spoke_db_alarm_connections_threshold
  alarms_enabled              = local.settings.alarms_enabled
  alarm_actions               = [data.aws_ssm_parameter.mission_control_arn.value]
  min_capacity                = local.settings.spoke_db_min_capacity
  max_capacity                = local.settings.spoke_db_max_capacity
  timeout_action              = local.settings.spoke_db_timeout_action
}



###########################################
## SQS Queue for Inbound Twilio Webhooks ##
###########################################

# SQS
resource "aws_sqs_queue" "spoke_twilio_webhook_dlq" {
  name = "${local.env}-spoke-twilio-webhook-dlq"
  tags = local.default_tags
}

resource "aws_sqs_queue" "spoke_twilio_webhook" {
  name = "${local.env}-spoke-twilio-webhook"
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.spoke_twilio_webhook_dlq.arn
    maxReceiveCount     = 3
  })
  tags = local.default_tags
}

resource "aws_ssm_parameter" "spoke_twilio_webhook_sqs_arn" {
  name  = "/${local.env}/spoke/sqs/TWILIO_WEBHOOK_QUEUE_ARN"
  type  = "String"
  value = aws_sqs_queue.spoke_twilio_webhook.arn
  tags  = local.default_tags
}

# IAM
resource "aws_iam_policy" "spoke_twilio_webhook_api_gateway" {
  name   = "${local.env}-spoke-twilio-webhook-api-gateway-policy"
  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
           "Effect": "Allow",
           "Resource": [
               "*"
           ],
           "Action": [
               "logs:CreateLogGroup",
               "logs:CreateLogStream",
               "logs:PutLogEvents"
           ]
       },
       {
           "Effect": "Allow",
           "Action": "sqs:SendMessage",
           "Resource": "${aws_sqs_queue.spoke_twilio_webhook.arn}"
       }
    ]
}
EOF
}

resource "aws_iam_role" "spoke_twilio_webhook_api_gateway" {
  name               = "${local.env}-spoke-twilio-webhook-api-gateway-role"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "apigateway.amazonaws.com"
      },
      "Effect": "Allow"
    }
  ]
}
EOF
  tags               = local.default_tags
}

resource "aws_iam_role_policy_attachment" "spoke_twilio_webhook_api_gateway" {
  role       = aws_iam_role.spoke_twilio_webhook_api_gateway.id
  policy_arn = aws_iam_policy.spoke_twilio_webhook_api_gateway.arn
}


resource "aws_cloudwatch_log_group" "spoke_twilio_webhook_api_gateway" {
  name              = "/ew/${local.env}/api-gateway/spoke-twilio-webhook"
  retention_in_days = 14
}

locals {
  spoke_api_gateway_sqs_integration_uri = "arn:aws:apigateway:${local.aws_region}:sqs:path/${local.aws_account_id}/${aws_sqs_queue.spoke_twilio_webhook.name}"
}

# API GATEWAY
// TODO create API Gateway Authorizer to validate request signatures
// https://www.twilio.com/docs/usage/webhooks/webhooks-security#validating-signatures-from-twilio
resource "aws_api_gateway_rest_api" "spoke_twilio_webhook" {
  name        = "${local.env}-spoke-twilio-webhook-sqs-api"
  description = "API to receive Twilio Webhooks and publish them to SQS"
  endpoint_configuration {
    types = ["EDGE"]
  }
  tags = local.default_tags
  // TODO: see if we can get rid of empty below
  body = <<EOF
{
  "swagger" : "2.0",
  "basePath" : "/",
  "schemes" : [ "https" ],
  "info" : {
    "title" : "${local.env}-spoke-twilio-webhook-sqs-api"
  },
  "paths" : {
    "/twilio" : {
      "post" : {
        "consumes" : [ "application/json" ],
        "produces" : [ "text/xml" ],
        "responses" : {
          "200" : {
            "description" : "200 response",
            "schema" : {
              "$ref" : "#/definitions/Empty"
            }
          }
        },
        "x-amazon-apigateway-integration" : {
          "credentials" : "${aws_iam_role.spoke_twilio_webhook_api_gateway.arn}",
          "uri" : "${local.spoke_api_gateway_sqs_integration_uri}",
          "responses" : {
            "default" : {
              "statusCode" : "200",
              "responseTemplates" : {
                "text/xml" : "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response/>"
              },
              "contentHandling" : "CONVERT_TO_TEXT"
            }
          },
          "requestParameters" : {
            "integration.request.header.Content-Type" : "'application/x-www-form-urlencoded'"
          },
          "passthroughBehavior" : "never",
          "httpMethod" : "POST",
          "requestTemplates" : {
            "application/json" : "Action=SendMessage&MessageBody=$input.body"
          },
          "type" : "aws"
        }
      }
    }
  },
  "definitions" : {
    "Empty" : {
      "type" : "object",
      "title" : "Empty Schema"
    }
  }
}
EOF
}

resource "aws_api_gateway_domain_name" "spoke_twilio_webhook" {
  certificate_arn = data.aws_acm_certificate.elizabethwarren_dot_codes.arn
  domain_name     = "${local.env}-spoke-webhook.elizabethwarren.codes"
  security_policy = "TLS_1_2"
  tags            = local.default_tags
}

resource "aws_api_gateway_deployment" "spoke_twilio_webhook" {
  rest_api_id = aws_api_gateway_rest_api.spoke_twilio_webhook.id
  stage_name  = local.env
}

resource "aws_api_gateway_base_path_mapping" "spoke_twilio_webhook" {
  api_id      = aws_api_gateway_rest_api.spoke_twilio_webhook.id
  stage_name  = aws_api_gateway_deployment.spoke_twilio_webhook.stage_name
  domain_name = aws_api_gateway_domain_name.spoke_twilio_webhook.domain_name
}

resource "aws_route53_record" "spoke_twilio_webhook" {
  name    = aws_api_gateway_domain_name.spoke_twilio_webhook.domain_name
  type    = "A"
  zone_id = data.aws_route53_zone.elizabethwarren_dot_codes.id

  alias {
    evaluate_target_health = true
    name                   = aws_api_gateway_domain_name.spoke_twilio_webhook.cloudfront_domain_name
    zone_id                = aws_api_gateway_domain_name.spoke_twilio_webhook.cloudfront_zone_id
  }
}