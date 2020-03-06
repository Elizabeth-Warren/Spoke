# Create a locked down S3 bucket

# Required
variable "name" { type = string }
variable "env" { type = string }

# Optional
variable "tags" { default = {} }
variable "enable_cors" { default = false }

# Cors defaults -- from https://aws-amplify.github.io/docs/js/storage#amazon-s3-bucket-cors-policy-setup
variable "cors_allowed_origins" { default = ["*"] }
variable "cors_allowed_methods" { default = ["HEAD", "GET", "PUT", "POST", "DELETE"] }
variable "cors_allowed_headers" { default = ["Authorization", "Content-*", "Host"] }
variable "cors_max_age_seconds" { default = 3000 }
variable "cors_expose_headers" { default = ["ETag", "x-amz-server-side-encryption", "x-amz-request-id", "x-amz-id-2"] }

# Resources
resource "aws_s3_bucket" "this" {
  bucket = "ew.${var.env}.${var.name}"
  acl    = "private"
  tags   = var.tags

  dynamic "cors_rule" {
    for_each = var.enable_cors ? [1] : []
    content {
      allowed_origins = var.cors_allowed_origins
      allowed_methods = var.cors_allowed_methods
      allowed_headers = var.cors_allowed_headers
      max_age_seconds = var.cors_max_age_seconds
      expose_headers  = var.cors_expose_headers
    }
  }
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_ssm_parameter" "bucket_name" {
  name  = "/${var.env}/s3/${var.name}/bucket/name"
  value = aws_s3_bucket.this.id
  type  = "SecureString"
  tags  = var.tags
}

resource "aws_ssm_parameter" "bucket_arn" {
  name  = "/${var.env}/s3/${var.name}/bucket/arn"
  value = aws_s3_bucket.this.arn
  type  = "SecureString"
  tags  = var.tags
}

# Outputs
output "name" {
  value = aws_s3_bucket.this.id
}

output "ssm_param_bucket_name" {
  value = aws_ssm_parameter.bucket_name.name
}

output "arn" {
  value = aws_s3_bucket.this.arn
}

output "ssm_param_bucket_arn" {
  value = aws_ssm_parameter.bucket_arn.name
}