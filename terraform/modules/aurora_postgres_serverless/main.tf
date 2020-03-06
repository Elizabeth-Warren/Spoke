# REQUIRED
variable "name" { type = string }
variable "env" { type = string }
variable "subnet_ids" { type = list(string) }
variable "vpc_security_group_ids" { type = list(string) }
variable "azs" { type = list(string) }
variable "autopause" { type = bool }
variable "alarms_enabled" { type = bool }

# OPTIONAL
variable "alarm_actions" { default = [] }
variable "alarm_connections_threshold" { default = 200 }
variable "alarm_connections_evaluation_periods" { default = 1 }
variable "alarm_cpu_threshold" { default = 80 }
variable "alarm_cpu_evaluation_periods" { default = 1 }
variable "enabled" { default = true }
variable "deletion_protection" { default = true }
variable "skip_final_snapshot" { default = false }
variable "min_capacity" { default = 2 }
variable "max_capacity" { default = 384 }
variable "timeout_action" { default = "ForceApplyCapacityChange" }

resource "random_password" "this" {
  length  = 16
  special = true

  # Added this because random password was generating a password that had chars that
  # aurora didnt allow. With the lifecycle this shouldnt impact existing passwords that
  # happened to generate ok.
  override_special = "_+=()"
  lifecycle {
    ignore_changes = [override_special]
  }
}

resource "aws_ssm_parameter" "db_admin_password" {
  name  = "/${var.env}/${var.name}/postgres/MASTER_PASSWORD"
  type  = "SecureString"
  value = random_password.this.result
}

resource "aws_ssm_parameter" "db_host" {
  count     = var.enabled ? 1 : 0
  name      = "/${var.env}/${var.name}/postgres/HOST"
  type      = "String"
  value     = aws_rds_cluster.this[0].endpoint
  overwrite = true
}

resource "aws_ssm_parameter" "db_dsn" {
  count = var.enabled ? 1 : 0
  name  = "/${var.env}/${var.name}/postgres/MASTER_DSN"
  type  = "SecureString"
  value = "db+postgresql://postgres:${random_password.this.result}@${aws_rds_cluster.this[0].endpoint}:5432/postgres"
}

resource "aws_db_subnet_group" "this" {
  name       = "${var.env}-${var.name}_db_subnet_group"
  subnet_ids = var.subnet_ids
  tags = {
    Environment = var.env
  }
}

resource "aws_rds_cluster" "this" {
  count                   = var.enabled ? 1 : 0
  cluster_identifier      = "${var.env}-${var.name}"
  database_name           = var.name
  engine                  = "aurora-postgresql"
  engine_mode             = "serverless"
  vpc_security_group_ids  = var.vpc_security_group_ids
  db_subnet_group_name    = aws_db_subnet_group.this.name
  backup_retention_period = 14
  deletion_protection     = var.deletion_protection
  skip_final_snapshot     = var.skip_final_snapshot
  master_username         = "postgres"
  master_password         = random_password.this.result
  availability_zones      = var.azs
  storage_encrypted       = true

  # TODO: Monitor scaling actions
  scaling_configuration {
    auto_pause               = var.autopause
    max_capacity             = var.max_capacity
    min_capacity             = var.min_capacity
    seconds_until_auto_pause = 300
    timeout_action           = var.timeout_action
  }

  tags = {
    Environment = var.env
  }
}

# Alarms
resource "aws_cloudwatch_metric_alarm" "db_connections" {
  count               = var.alarms_enabled && var.enabled ? 1 : 0
  alarm_name          = "${aws_rds_cluster.this[0].id}-alarm-DatabaseConnections"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = var.alarm_connections_evaluation_periods
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Sum"
  threshold           = var.alarm_connections_threshold
  alarm_description   = "RDS Maximum connection Alarm for ${aws_rds_cluster.this[0].id} writer"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.this[0].id
  }

  tags = {
    Environment = var.env
  }
}

resource "aws_cloudwatch_metric_alarm" "db_cpu" {
  count               = var.alarms_enabled && var.enabled ? 1 : 0
  alarm_name          = "${aws_rds_cluster.this[0].id}-alarm-CPU"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = var.alarm_cpu_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Maximum"
  threshold           = var.alarm_cpu_threshold
  alarm_description   = "RDS CPU Alarm for ${aws_rds_cluster.this[0].id} writer"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.this[0].id
  }

  tags = {
    Environment = var.env
  }
}

# outputs
output "endpoint" {
  value = length(aws_rds_cluster.this) > 0 ? aws_rds_cluster.this[0].endpoint : ""
}

output "ssm_param_dsn" {
  value = length(aws_ssm_parameter.db_dsn) > 0 ? aws_ssm_parameter.db_dsn[0].arn : ""
}

output "master_password" {
  value = random_password.this.result
}